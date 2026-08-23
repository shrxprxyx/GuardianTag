import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import { colors } from "@/constants/theme";
import type { Notification, NotificationType } from "@/types/api";

const typeIcon: Record<NotificationType, keyof typeof Feather.glyphMap> = {
  incident: "alert-triangle",
  achievement: "award",
  challenge: "target",
  device_health: "cpu",
  system: "info",
};

const typeColor: Record<NotificationType, string> = {
  incident: colors.emergency,
  achievement: colors.primary,
  challenge: colors.primary,
  device_health: colors.warning,
  system: colors.muted,
};

export default function Notifications() {
  const api = useApi();
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<Notification[]>("/notifications"),
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => api.patch<Notification>(`/notifications/${id}/read`),
    onSuccess: (data) => {
      queryClient.setQueryData<Notification[]>(["notifications"], (prev) =>
        prev?.map((n) => (n.id === data.id ? data : n)),
      );
    },
  });

  const notifications = notificationsQuery.data ?? [];
  const unread = notifications.filter((n) => !n.is_read);

  const openNotification = (notification: Notification) => {
    if (!notification.is_read) readMutation.mutate(notification.id);

    const incidentId = notification.data?.incident_id;
    if (notification.type === "incident" && typeof incidentId === "string") {
      router.push({
        pathname: "/(app)/incidents/[id]",
        params: {
          id: incidentId,
        },
      });
    }
  };

  return (
    <ScreenContainer
      onRefresh={() => notificationsQuery.refetch()}
      refreshing={notificationsQuery.isRefetching}
    >
      <ScreenHeader
        title="Notifications"
        showBack
        subtitle={unread.length > 0 ? `${unread.length} unread` : "You're all caught up"}
        right={
          unread.length > 0 ? (
            <Pressable
              onPress={() => unread.forEach((n) => readMutation.mutate(n.id))}
              className="p-2"
            >
              <Text className="text-primary-light text-[13px] font-medium">Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />

      {notificationsQuery.isLoading ? <LoadingState /> : null}
      {notificationsQuery.error ? (
        <ErrorState
          message={(notificationsQuery.error as Error).message}
          onRetry={() => notificationsQuery.refetch()}
        />
      ) : null}

      {!notificationsQuery.isLoading && !notificationsQuery.error && notifications.length === 0 ? (
        <EmptyState title="No notifications yet" message="We'll let you know when something happens." />
      ) : null}

      {notifications.length > 0 ? (
        <Card>
          {notifications.map((notification, i) => (
            <Pressable
              key={notification.id}
              onPress={() => openNotification(notification)}
              className={`flex-row items-start py-3.5 ${i === notifications.length - 1 ? "" : "border-b border-hairline"
                }`}
            >
              <View
                className="w-9 h-9 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: colors.surfaceAlt }}
              >
                <Feather name={typeIcon[notification.type]} size={16} color={typeColor[notification.type]} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text
                    className={`text-[14px] flex-1 ${notification.is_read
                        ? "text-muted dark:text-[#8A8D98]"
                        : "text-foreground dark:text-white font-semibold"
                      }`}
                  >
                    {notification.title}
                  </Text>
                  {!notification.is_read ? (
                    <View
                      className="w-2 h-2 rounded-full ml-2"
                      style={{ backgroundColor: colors.primary }}
                    />
                  ) : null}
                </View>
                <Text className="text-muted dark:text-[#8A8D98] text-[13px] mt-0.5">{notification.body}</Text>
                <Text className="text-muted dark:text-[#8A8D98] text-[11px] mt-1">
                  {new Date(notification.created_at).toLocaleString()}
                </Text>
              </View>
            </Pressable>
          ))}
        </Card>
      ) : null}
    </ScreenContainer>
  );
}