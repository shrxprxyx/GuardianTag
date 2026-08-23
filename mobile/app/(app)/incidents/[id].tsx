import { useState } from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmSheet } from "@/components/ui/ConfirmSheet";
import { LoadingState, ErrorState } from "@/components/ui/StateViews";
import { colors } from "@/constants/theme";
import { toastBus } from "@/lib/toast";
import type { IncidentDetail, IncidentStatus } from "@/types/api";

const statusTone: Record<IncidentStatus, BadgeTone> = {
  open: "emergency",
  investigating: "warning",
  resolved: "safe",
  false_alarm: "muted",
};

const statusLabel: Record<IncidentStatus, string> = {
  open: "Open",
  investigating: "Investigating",
  resolved: "Resolved",
  false_alarm: "False alarm",
};

const severityTone: Record<IncidentDetail["severity"], BadgeTone> = {
  low: "muted",
  medium: "warning",
  high: "emergency",
  critical: "emergency",
};

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useApi();
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<"resolved" | "false_alarm" | null>(null);

  const incidentQuery = useQuery({
    queryKey: ["incident", id],
    queryFn: () => api.get<IncidentDetail>(`/incidents/${id}`),
    enabled: !!id,
  });

  const resolveMutation = useMutation({
    mutationFn: (status: IncidentStatus) =>
      api.patch<IncidentDetail>(`/incidents/${id}/resolve`, {
        status,
        resolution_notes:
          status === "false_alarm" ? "Marked as false alarm from the app" : "Resolved from the app",
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["incident", id], data);
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-summary"] });
      toastBus.show({
        icon: data.status === "resolved" ? "check-circle" : "shield-off",
        title: data.status === "resolved" ? "Case Resolved" : "Marked False Alarm",
        tone: data.status === "resolved" ? "safe" : "warning",
      });
    },
  });

  if (incidentQuery.isLoading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Case" showBack />
        <LoadingState />
      </ScreenContainer>
    );
  }

  if (incidentQuery.error || !incidentQuery.data) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Case" showBack />
        <ErrorState onRetry={() => incidentQuery.refetch()} />
      </ScreenContainer>
    );
  }

  const incident = incidentQuery.data;
  const isOpen = incident.status === "open" || incident.status === "investigating";

  return (
    <ScreenContainer>
      <ScreenHeader title="Case" showBack />

      <Card className="mb-4">
        <View className="flex-row items-start justify-between mb-2">
          <Text className="text-foreground dark:text-white font-bold text-[18px] flex-1 mr-2">
            {incident.title}
          </Text>
          <Badge label={incident.severity} tone={severityTone[incident.severity]} />
        </View>
        {incident.description ? (
          <Text className="text-muted dark:text-[#8A8D98] text-[14px] mb-3">{incident.description}</Text>
        ) : null}
        <View className="flex-row items-center justify-between">
          <Badge label={statusLabel[incident.status]} tone={statusTone[incident.status]} />
          <Text className="text-muted dark:text-[#8A8D98] text-[12px]">
            {new Date(incident.triggered_at).toLocaleString()}
          </Text>
        </View>
        {incident.resolution_notes ? (
          <Text className="text-muted dark:text-[#8A8D98] text-[13px] mt-3">
            {incident.resolution_notes}
          </Text>
        ) : null}
      </Card>

      {isOpen ? (
        <View className="mb-6">
          <Button
            label="Mark Resolved"
            loading={resolveMutation.isPending && resolveMutation.variables === "resolved"}
            onPress={() => setConfirmAction("resolved")}
          />
          <View className="mt-2.5">
            <Button
              label="Mark as False Alarm"
              variant="secondary"
              loading={resolveMutation.isPending && resolveMutation.variables === "false_alarm"}
              onPress={() => setConfirmAction("false_alarm")}
            />
          </View>
        </View>
      ) : null}

      <Text className="text-foreground dark:text-white font-semibold text-[16px] mb-2">Timeline</Text>
      {incident.timeline_events.length === 0 ? (
        <Text className="text-muted dark:text-[#8A8D98] text-[13px] mb-6">No timeline events yet.</Text>
      ) : (
        <Card className="mb-6">
          {incident.timeline_events
            .slice()
            .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime())
            .map((event, i, arr) => (
              <View
                key={event.id}
                className={`flex-row py-3 ${i === arr.length - 1 ? "" : "border-b border-hairline"}`}
              >
                <View className="w-8 h-8 rounded-full bg-surface-alt items-center justify-center mr-3">
                  <Feather name="clock" size={14} color={colors.mutedLight} />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground dark:text-white text-[14px]">{event.description}</Text>
                  <Text className="text-muted dark:text-[#8A8D98] text-[12px] mt-0.5">
                    {new Date(event.occurred_at).toLocaleString()} · {event.actor}
                  </Text>
                </View>
              </View>
            ))}
        </Card>
      )}

      {incident.evidence_items.length > 0 ? (
        <>
          <Text className="text-foreground dark:text-white font-semibold text-[16px] mb-2">Evidence</Text>
          <Card className="mb-6">
            {incident.evidence_items.map((evidence, i, arr) => (
              <View
                key={evidence.id}
                className={`flex-row py-3 ${i === arr.length - 1 ? "" : "border-b border-hairline"}`}
              >
                <View className="w-8 h-8 rounded-full bg-surface-alt items-center justify-center mr-3">
                  <Feather
                    name={evidence.type === "photo" ? "image" : evidence.type === "note" ? "file-text" : "activity"}
                    size={14}
                    color={colors.mutedLight}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground dark:text-white text-[14px]">
                    {evidence.content ?? evidence.type}
                  </Text>
                  <Text className="text-muted dark:text-[#8A8D98] text-[12px] mt-0.5">
                    {new Date(evidence.captured_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <ConfirmSheet
        visible={confirmAction !== null}
        title={confirmAction === "resolved" ? "Mark case as resolved?" : "Mark as false alarm?"}
        message={
          confirmAction === "resolved"
            ? "This will close the case as resolved."
            : "This will close the case as a false alarm."
        }
        confirmLabel="Confirm"
        destructive={false}
        onConfirm={() => {
          if (confirmAction) resolveMutation.mutate(confirmAction);
          setConfirmAction(null);
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </ScreenContainer>
  );
}