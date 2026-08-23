import { useEffect, useState } from "react";
import { View, Text, TextInput } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@clerk/expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { StatRow } from "@/components/ui/StatRow";
import { ListRow } from "@/components/ui/ListRow";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState } from "@/components/ui/StateViews";
import { colors, guardianLevelLabels } from "@/constants/theme";
import { toastBus } from "@/lib/toast";
import type { AnalyticsSummary, SecurityScore, User } from "@/types/api";

export default function Profile() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();

  const [fullName, setFullName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [phone, setPhone] = useState("");

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<User>("/auth/me"),
  });
  const scoreQuery = useQuery({
    queryKey: ["security-score"],
    queryFn: () => api.get<SecurityScore>("/gamification/security-score"),
  });
  const summaryQuery = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => api.get<AnalyticsSummary>("/analytics/summary"),
  });

  useEffect(() => {
    if (meQuery.data) {
      setFullName(meQuery.data.full_name);
      setRoomNumber(meQuery.data.room_number ?? "");
      setPhone(meQuery.data.phone ?? "");
    }
  }, [meQuery.data]);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.patch<User>("/auth/me", {
        full_name: fullName.trim(),
        room_number: roomNumber.trim() || null,
        phone: phone.trim() || null,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["me"], data);
      toastBus.show({ icon: "check-circle", title: "Profile updated", tone: "safe" });
    },
  });

  const loading = meQuery.isLoading || scoreQuery.isLoading || summaryQuery.isLoading;
  const error = meQuery.error || scoreQuery.error || summaryQuery.error;

  return (
    <ScreenContainer>
      <ScreenHeader title="Profile" showBack subtitle="Your account" />

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={(error as Error).message} onRetry={() => meQuery.refetch()} /> : null}

      {!loading && !error && meQuery.data ? (
        <>
          <View className="items-center mb-5">
            <View className="w-20 h-20 rounded-full bg-surface-alt border border-border items-center justify-center mb-3">
              <Text className="text-primary-light font-bold text-[28px]">
                {meQuery.data.full_name?.[0]?.toUpperCase() ?? "?"}
              </Text>
            </View>
            <Text className="text-foreground dark:text-white font-bold text-[18px]">
              {meQuery.data.full_name}
            </Text>
            <Text className="text-muted dark:text-[#8A8D98] text-[13px] mt-0.5">{meQuery.data.email}</Text>
            {scoreQuery.data ? (
              <View className="mt-2 px-2.5 py-1 rounded-md bg-primary/15">
                <Text className="text-primary-light text-xs font-medium">
                  {guardianLevelLabels[scoreQuery.data.level]}
                </Text>
              </View>
            ) : null}
          </View>

          {scoreQuery.data && summaryQuery.data ? (
            <StatRow className="mb-6">
              <StatTile label="XP" value={scoreQuery.data.score} accent="text-primary-light" />
              <StatTile label="Protected assets" value={summaryQuery.data.total_assets} />
              <StatTile label="Devices" value={summaryQuery.data.total_devices} />
            </StatRow>
          ) : null}

          <Text className="text-foreground dark:text-white font-semibold text-[15px] mb-2">Edit profile</Text>
          <Card className="mb-6">
            <Text className="text-muted dark:text-[#8A8D98] text-[13px] mb-1">Full name</Text>
            <TextInput
              className="bg-surface-alt dark:bg-[#1B1D24] text-foreground dark:text-white rounded-xl px-4 py-3 border border-border mb-3"
              placeholder="Full name"
              placeholderTextColor="#8B8B9E"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
            <Text className="text-muted dark:text-[#8A8D98] text-[13px] mb-1">Room number</Text>
            <TextInput
              className="bg-surface-alt dark:bg-[#1B1D24] text-foreground dark:text-white rounded-xl px-4 py-3 border border-border mb-3"
              placeholder="Room number"
              placeholderTextColor="#8B8B9E"
              value={roomNumber}
              onChangeText={setRoomNumber}
              autoCapitalize="characters"
            />
            <Text className="text-muted dark:text-[#8A8D98] text-[13px] mb-1">Phone</Text>
            <TextInput
              className="bg-surface-alt dark:bg-[#1B1D24] text-foreground dark:text-white rounded-xl px-4 py-3 border border-border mb-4"
              placeholder="Optional"
              placeholderTextColor="#8B8B9E"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Button
              label="Save changes"
              onPress={() => updateMutation.mutate()}
              loading={updateMutation.isPending}
              disabled={fullName.trim().length === 0}
            />
          </Card>

          <Text className="text-foreground dark:text-white font-semibold text-[15px] mb-2">Quick links</Text>
          <Card className="mb-6">
            <ListRow
              icon="bar-chart-2"
              title="Analytics"
              showChevron
              onPress={() => router.push("/(app)/analytics")}
            />
            <ListRow
              icon="briefcase"
              title="Assets"
              showChevron
              onPress={() => router.push("/(app)/assets")}
            />
            <ListRow
              icon="map-pin"
              title="Hostel map"
              showChevron
              onPress={() => router.push("/(app)/hostel-map")}
            />
            <ListRow
              icon="settings"
              title="Settings"
              showChevron
              isLast
              onPress={() => router.push("/(app)/settings")}
            />
          </Card>

          <Card className="mb-6">
            <ListRow
              icon="log-out"
              title="Sign out"
              tone="emergency"
              isLast
              onPress={() => signOut()}
            />
          </Card>
        </>
      ) : null}
    </ScreenContainer>
  );
}   