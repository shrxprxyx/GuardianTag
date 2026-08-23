import { useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { LoadingState, ErrorState } from "@/components/ui/StateViews";
import { colors, guardianLevelLabels } from "@/constants/theme";
import type { Achievement, SecurityScore, UserAchievement, XPTransaction } from "@/types/api";

const ACTIVITY_DAYS = 28;

export default function GamificationHome() {
  const api = useApi();

  const scoreQuery = useQuery({
    queryKey: ["security-score"],
    queryFn: () => api.get<SecurityScore>("/gamification/security-score"),
  });
  const xpQuery = useQuery({
    queryKey: ["xp-transactions"],
    queryFn: () => api.get<XPTransaction[]>("/gamification/xp"),
  });
  const achievementsQuery = useQuery({
    queryKey: ["achievements"],
    queryFn: () => api.get<Achievement[]>("/gamification/achievements"),
  });
  const unlockedQuery = useQuery({
    queryKey: ["achievements-unlocked"],
    queryFn: () => api.get<UserAchievement[]>("/gamification/achievements/unlocked"),
  });

  const loading = scoreQuery.isLoading || xpQuery.isLoading;
  const error = scoreQuery.error || xpQuery.error;

  const totalXP = useMemo(
    () => (xpQuery.data ?? []).reduce((sum, t) => sum + t.amount, 0),
    [xpQuery.data],
  );

  const activityDays = useMemo(() => {
    const days: { date: string; active: boolean; incident: boolean }[] = [];
    const today = new Date();
    for (let i = ACTIVITY_DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({ date: d.toDateString(), active: false, incident: false });
    }
    const byDate = new Map(days.map((d) => [d.date, d]));
    for (const t of xpQuery.data ?? []) {
      const key = new Date(t.created_at).toDateString();
      const entry = byDate.get(key);
      if (!entry) continue;
      entry.active = true;
      if (t.reference_type === "incident_resolved") entry.incident = true;
    }
    return days;
  }, [xpQuery.data]);

  return (
    <ScreenContainer onRefresh={() => scoreQuery.refetch()} refreshing={scoreQuery.isRefetching}>
      <ScreenHeader title="Rewards" subtitle="Your XP and badges" />

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={(error as Error).message} onRetry={() => scoreQuery.refetch()} /> : null}

      {!loading && !error && scoreQuery.data ? (
        <>
          <Card className="mb-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-foreground dark:text-white font-bold text-[16px]">
                  {guardianLevelLabels[scoreQuery.data.level]}
                </Text>
                <Text className="text-muted dark:text-[#8A8D98] text-[13px] mt-0.5">
                  {totalXP} XP · {scoreQuery.data.streak_days}-day streak
                </Text>
              </View>
              {unlockedQuery.data && achievementsQuery.data ? (
                <Text className="text-primary-light font-semibold text-[15px]">
                  {unlockedQuery.data.length}/{achievementsQuery.data.length}
                </Text>
              ) : null}
            </View>
          </Card>

          <Card className="mb-4">
            <Text className="text-foreground dark:text-white font-semibold text-[14px] mb-3">
              Security activity, last {ACTIVITY_DAYS} days
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {activityDays.map((day) => (
                <View
                  key={day.date}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    backgroundColor: day.incident
                      ? colors.emergency
                      : day.active
                        ? colors.primary
                        : colors.surfaceAlt,
                  }}
                />
              ))}
            </View>
          </Card>

          <Card className="mb-6">
            <ListRow
              icon="zap"
              title="Guardian XP"
              subtitle="Points earned & streak"
              showChevron
              onPress={() => router.push("/(app)/gamification/xp")}
            />
            <ListRow
              icon="award"
              title="Achievements"
              subtitle="Unlocked badges"
              showChevron
              onPress={() => router.push("/(app)/gamification/achievements")}
            />
            <ListRow
              icon="target"
              title="Challenges"
              subtitle="Coming soon"
              tone="default"
              right={<Feather name="lock" size={14} color={colors.muted} />}
            />
            <ListRow
              icon="book-open"
              title="Guardian Academy"
              subtitle="Coming soon"
              isLast
              right={<Feather name="lock" size={14} color={colors.muted} />}
            />
          </Card>
        </>
      ) : null}
    </ScreenContainer>
  );
}