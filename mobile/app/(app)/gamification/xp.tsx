import { useMemo } from "react";
import { View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { StatRow } from "@/components/ui/StatRow";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import { colors } from "@/constants/theme";
import type { XPTransaction } from "@/types/api";

export default function GuardianXP() {
  const api = useApi();
  const xpQuery = useQuery({
    queryKey: ["xp-transactions"],
    queryFn: () => api.get<XPTransaction[]>("/gamification/xp"),
  });

  const transactions = xpQuery.data ?? [];
  const totalXP = useMemo(() => transactions.reduce((sum, t) => sum + t.amount, 0), [transactions]);

  return (
    <ScreenContainer onRefresh={() => xpQuery.refetch()} refreshing={xpQuery.isRefetching}>
      <ScreenHeader title="Guardian XP" showBack subtitle="Points earned & streak" />

      {xpQuery.isLoading ? <LoadingState /> : null}
      {xpQuery.error ? (
        <ErrorState message={(xpQuery.error as Error).message} onRetry={() => xpQuery.refetch()} />
      ) : null}

      {!xpQuery.isLoading && !xpQuery.error ? (
        <>
          <StatRow className="mb-6">
            <StatTile label="Total XP" value={totalXP} accent="text-primary-light" />
            <StatTile label="Transactions" value={transactions.length} />
          </StatRow>

          {transactions.length === 0 ? (
            <EmptyState title="No XP yet" message="Complete Guardian checks and resolve cases to earn XP." />
          ) : (
            <Card className="mb-6">
              {transactions.map((t, i) => (
                <View
                  key={t.id}
                  className={`flex-row items-center py-3 ${
                    i === transactions.length - 1 ? "" : "border-b border-hairline"
                  }`}
                >
                  <View className="w-9 h-9 rounded-full bg-surface-alt items-center justify-center mr-3">
                    <Feather name="zap" size={16} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground dark:text-white text-[14px]">{t.reason}</Text>
                    <Text className="text-muted dark:text-[#8A8D98] text-[12px] mt-0.5">
                      {new Date(t.created_at).toLocaleString()}
                    </Text>
                  </View>
                  <Text className="text-primary-light font-semibold text-[14px]">+{t.amount}</Text>
                </View>
              ))}
            </Card>
          )}
        </>
      ) : null}
    </ScreenContainer>
  );
}