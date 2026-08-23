import { useEffect, useState } from "react";
import { View, Text, Switch, Pressable, Linking } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { Storage as kvStore } from "expo-sqlite/kv-store";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { Badge } from "@/components/ui/Badge";
import { LoadingState, ErrorState } from "@/components/ui/StateViews";
import { colors } from "@/constants/theme";
import { toastBus } from "@/lib/toast";
import type { TelegramLinkCode, User } from "@/types/api";

const PUSH_KEY = "settings:push-notifications";
const SOUND_KEY = "settings:sound-alerts";

export default function Settings() {
  const api = useApi();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [push, sound] = await Promise.all([kvStore.getItem(PUSH_KEY), kvStore.getItem(SOUND_KEY)]);
      setPushEnabled(push !== "false");
      setSoundEnabled(sound !== "false");
      setPrefsLoaded(true);
    })();
  }, []);

  const togglePush = (value: boolean) => {
    setPushEnabled(value);
    kvStore.setItem(PUSH_KEY, String(value));
  };
  const toggleSound = (value: boolean) => {
    setSoundEnabled(value);
    kvStore.setItem(SOUND_KEY, String(value));
  };

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<User>("/auth/me"),
  });

  const linkMutation = useMutation({
    mutationFn: () => api.post<TelegramLinkCode>("/auth/telegram/link-code"),
    onSuccess: (data) => {
      if (data.deep_link) {
        Linking.openURL(data.deep_link);
      } else {
        toastBus.show({
          icon: "alert-triangle",
          title: "Telegram bot not configured",
          tone: "warning",
        });
      }
    },
  });

  const telegramConnected = !!meQuery.data?.telegram_chat_id;

  return (
    <ScreenContainer>
      <ScreenHeader title="Settings" showBack />

      {meQuery.isLoading || !prefsLoaded ? <LoadingState /> : null}
      {meQuery.error ? (
        <ErrorState message={(meQuery.error as Error).message} onRetry={() => meQuery.refetch()} />
      ) : null}

      {!meQuery.isLoading && prefsLoaded && !meQuery.error ? (
        <>
          <Text className="text-foreground dark:text-white font-semibold text-[15px] mb-2">Notifications</Text>
          <Card className="mb-6">
            <ListRow
              icon="bell"
              title="Push notifications"
              subtitle="Alerts on this device"
              right={
                <Switch
                  value={pushEnabled}
                  onValueChange={togglePush}
                  trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <ListRow
              icon="volume-2"
              title="Sound alerts"
              subtitle="Play a sound for new alerts"
              isLast
              right={
                <Switch
                  value={soundEnabled}
                  onValueChange={toggleSound}
                  trackColor={{ false: colors.surfaceAlt, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          </Card>

          <Text className="text-foreground dark:text-white font-semibold text-[15px] mb-2">
            Telegram alerts
          </Text>
          <Card className="mb-6">
            <ListRow
              icon="send"
              title={telegramConnected ? "Telegram connected" : "Connect Telegram"}
              subtitle={
                telegramConnected
                  ? "You'll get alerts on Telegram too"
                  : "Get instant alerts in Telegram"
              }
              isLast
              right={
                telegramConnected ? (
                  <Badge label="Connected" tone="safe" />
                ) : (
                  <Pressable
                    onPress={() => linkMutation.mutate()}
                    disabled={linkMutation.isPending}
                    className="px-3 py-1.5 rounded-full bg-primary"
                  >
                    <Text className="text-background text-[12px] font-semibold">
                      {linkMutation.isPending ? "..." : "Connect"}
                    </Text>
                  </Pressable>
                )
              }
            />
          </Card>

          <Text className="text-foreground dark:text-white font-semibold text-[15px] mb-2">About</Text>
          <Card className="mb-6">
            <ListRow icon="info" title="About" showChevron onPress={() => router.push("/(app)/about")} />
            <ListRow
              icon="help-circle"
              title="Help & support"
              showChevron
              isLast
              onPress={() => router.push("/(app)/help")}
            />
          </Card>
        </>
      ) : null}
    </ScreenContainer>
  );
}