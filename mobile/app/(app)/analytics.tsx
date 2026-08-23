import { useMemo } from "react";
import { View, Text } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { StatRow } from "@/components/ui/StatRow";
import { LoadingState, ErrorState } from "@/components/ui/StateViews";
import { colors } from "@/constants/theme";
import type { AnalyticsSummary, AssetCoverage, DailyIncidentCountApi, ResponseTimes } from "@/types/api";

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

export default function Analytics() {
  const api = useApi();

  const summaryQuery = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => api.get<AnalyticsSummary>("/analytics/summary"),
  });
  const trendQuery = useQuery({
    queryKey: ["analytics-trend"],
    queryFn: () => api.get<DailyIncidentCountApi[]>("/analytics/incidents-trend?days=14"),
  });
  const responseTimesQuery = useQuery({
    queryKey: ["analytics-response-times"],
    queryFn: () => api.get<ResponseTimes>("/analytics/response-times"),
  });
  const coverageQuery = useQuery({
    queryKey: ["analytics-coverage"],
    queryFn: () => api.get<AssetCoverage>("/analytics/asset-coverage"),
  });

  const loading =
    summaryQuery.isLoading || trendQuery.isLoading || responseTimesQuery.isLoading || coverageQuery.isLoading;
  const error = summaryQuery.error || trendQuery.error || responseTimesQuery.error || coverageQuery.error;

  const maxCount = useMemo(
    () => Math.max(1, ...(trendQuery.data ?? []).map((d) => d.count)),
    [trendQuery.data],
  );

  return (
    <ScreenContainer onRefresh={() => summaryQuery.refetch()} refreshing={summaryQuery.isRefetching}>
      <ScreenHeader title="Analytics" showBack subtitle="Your security overview" />

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={(error as Error).message} onRetry={() => summaryQuery.refetch()} /> : null}

      {!loading && !error && summaryQuery.data ? (
        <>
          <StatRow className="mb-6">
            <StatTile label="Devices" value={summaryQuery.data.total_devices} />
            <StatTile label="Assets" value={summaryQuery.data.total_assets} />
            <StatTile label="Open" value={summaryQuery.data.open_incidents} accent="text-emergency" />
          </StatRow>

          <Text className="text-foreground dark:text-white font-semibold text-[15px] mb-2">
            Incidents, last 14 days
          </Text>
          <Card className="mb-6">
            <View className="flex-row items-end justify-between" style={{ height: 100 }}>
              {(trendQuery.data ?? []).map((d) => {
                const heightPct = d.count === 0 ? 4 : Math.max(10, (d.count / maxCount) * 100);
                return (
                  <View key={d.date} className="items-center flex-1">
                    <View
                      style={{
                        width: 10,
                        height: `${heightPct}%`,
                        borderRadius: 4,
                        backgroundColor: d.count > 0 ? colors.primary : colors.surfaceAlt,
                      }}
                    />
                  </View>
                );
              })}
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-muted dark:text-[#8A8D98] text-[11px]">
                {trendQuery.data?.[0]?.date}
              </Text>
              <Text className="text-muted dark:text-[#8A8D98] text-[11px]">
                {trendQuery.data?.[trendQuery.data.length - 1]?.date}
              </Text>
            </View>
          </Card>

          <Text className="text-foreground dark:text-white font-semibold text-[15px] mb-2">
            Case outcomes
          </Text>
          <StatRow className="mb-6">
            <StatTile label="Resolved" value={summaryQuery.data.resolved_incidents} accent="text-safe" />
            <StatTile label="False alarms" value={summaryQuery.data.false_alarms} />
          </StatRow>

          {responseTimesQuery.data ? (
            <>
              <Text className="text-foreground dark:text-white font-semibold text-[15px] mb-2">
                Response times
              </Text>
              <Card className="mb-6">
                <View className="flex-row items-center justify-between py-2.5 border-b border-hairline">
                  <Text className="text-muted dark:text-[#8A8D98] text-[13px]">Avg. time to resolve</Text>
                  <Text className="text-foreground dark:text-white text-[14px] font-medium">
                    {formatDuration(responseTimesQuery.data.avg_resolution_seconds)}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between py-2.5 border-b border-hairline">
                  <Text className="text-muted dark:text-[#8A8D98] text-[13px]">Avg. disarm time</Text>
                  <Text className="text-foreground dark:text-white text-[14px] font-medium">
                    {formatDuration(responseTimesQuery.data.avg_disarm_seconds)}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between py-2.5">
                  <Text className="text-muted dark:text-[#8A8D98] text-[13px]">Fastest disarm</Text>
                  <Text className="text-foreground dark:text-white text-[14px] font-medium">
                    {formatDuration(responseTimesQuery.data.fastest_disarm_seconds)}
                  </Text>
                </View>
              </Card>
            </>
          ) : null}

          {coverageQuery.data ? (
            <>
              <Text className="text-foreground dark:text-white font-semibold text-[15px] mb-2">
                Asset coverage
              </Text>
              <Card className="mb-6">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-foreground dark:text-white text-[14px]">
                    {coverageQuery.data.armed_assets} of {coverageQuery.data.total_assets} armed
                  </Text>
                  <Text className="text-primary-light font-semibold text-[14px]">
                    {coverageQuery.data.coverage_percent}%
                  </Text>
                </View>
                <View className="h-2 rounded-full bg-surface-alt overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${coverageQuery.data.coverage_percent}%`,
                      backgroundColor: colors.primary,
                    }}
                  />
                </View>
              </Card>
            </>
          ) : null}
        </>
      ) : null}
    </ScreenContainer>
  );
}