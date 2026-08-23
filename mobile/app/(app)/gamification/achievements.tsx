import { useMemo } from "react";
import { View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import { colors } from "@/constants/theme";
import type { Achievement, UserAchievement } from "@/types/api";

export default function Achievements() {
  const api = useApi();
  const achievementsQuery = useQuery({
    queryKey: ["achievements"],
    queryFn: () => api.get<Achievement[]>("/gamification/achievements"),
  });
  const unlockedQuery = useQuery({
    queryKey: ["achievements-unlocked"],
    queryFn: () => api.get<UserAchievement[]>("/gamification/achievements/unlocked"),
  });

  const loading = achievementsQuery.isLoading || unlockedQuery.isLoading;
  const error = achievementsQuery.error || unlockedQuery.error;

  const unlockedMap = useMemo(() => {
    const map = new Map<string, UserAchievement>();
    for (const ua of unlockedQuery.data ?? []) map.set(ua.achievement.id, ua);
    return map;
  }, [unlockedQuery.data]);

  const achievements = achievementsQuery.data ?? [];

  return (
    <ScreenContainer onRefresh={() => achievementsQuery.refetch()} refreshing={achievementsQuery.isRefetching}>
      <ScreenHeader
        title="Achievements"
        showBack
        subtitle={`${unlockedMap.size}/${achievements.length} unlocked`}
      />

      {loading ? <LoadingState /> : null}
      {error ? (
        <ErrorState message={(error as Error).message} onRetry={() => achievementsQuery.refetch()} />
      ) : null}

      {!loading && !error && achievements.length === 0 ? (
        <EmptyState title="No achievements yet" message="Check back soon." />
      ) : null}

      {!loading && !error
        ? achievements.map((achievement) => {
            const unlocked = unlockedMap.get(achievement.id);
            return (
              <Card key={achievement.id} className={`mb-3 ${unlocked ? "" : "opacity-50"}`}>
                <View className="flex-row items-center">
                  <View
                    className="w-11 h-11 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: unlocked ? "rgba(105,215,184,0.16)" : colors.surfaceAlt }}
                  >
                    <Feather
                      name={unlocked ? "award" : "lock"}
                      size={18}
                      color={unlocked ? colors.primary : colors.muted}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground dark:text-white font-semibold text-[15px]">
                      {achievement.name}
                    </Text>
                    <Text className="text-muted dark:text-[#8A8D98] text-[13px] mt-0.5">
                      {achievement.description}
                    </Text>
                    {unlocked ? (
                      <Text className="text-muted dark:text-[#8A8D98] text-[11px] mt-1">
                        Unlocked {new Date(unlocked.unlocked_at).toLocaleDateString()}
                      </Text>
                    ) : null}
                  </View>
                  <Badge label={`+${achievement.xp_reward} XP`} tone={unlocked ? "primary" : "muted"} />
                </View>
              </Card>
            );
          })
        : null}
    </ScreenContainer>
  );
}