import { View, Text, Switch, Pressable } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";

import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { ShieldScanner } from "@/components/ui/ShieldScanner";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/ui/StateViews";

import { colors } from "@/constants/theme";
import { toastBus } from "@/lib/toast";

import type { Asset, Incident } from "@/types/api";

export default function GuardianMode() {
  const api = useApi();
  const queryClient = useQueryClient();

  // --------------------------------------------------
  // GET ASSETS
  // --------------------------------------------------
  const assetsQuery = useQuery({
    queryKey: ["assets"],
    queryFn: () => api.get<Asset[]>("/assets"),
  });

  // --------------------------------------------------
  // ARM / DISARM ASSET
  // --------------------------------------------------
  const armMutation = useMutation({
    mutationFn: ({
      id,
      is_armed,
    }: {
      id: string;
      is_armed: boolean;
    }) => api.patch<Asset>(`/assets/${id}`, { is_armed }),

    onSuccess: (asset) => {
      queryClient.invalidateQueries({
        queryKey: ["assets"],
      });

      toastBus.show(
        asset.is_armed
          ? {
              icon: "shield",
              title: "Guardian Protected",
              subtitle: asset.name,
              tone: "primary",
            }
          : {
              icon: "shield-off",
              title: "Guardian Disarmed",
              subtitle: asset.name,
              tone: "warning",
            },
      );
    },
  });

  // --------------------------------------------------
  // DEV ONLY - SIMULATE ALERT
  // --------------------------------------------------
  const simulateMutation = useMutation({
    mutationFn: () =>
      api.post<Incident>("/devices/simulate-alert"),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["incidents"],
      });

      toastBus.show({
        icon: "alert-triangle",
        title: "Alert Detected",
        subtitle: "New case opened",
        tone: "emergency",
      });

      router.push("/(app)/emergency-alert");
    },
  });

  // --------------------------------------------------
  // CALCULATE GUARDIAN STATUS
  // --------------------------------------------------
  const assets = assetsQuery.data ?? [];

  const armedCount = assets.filter(
    (asset) => asset.is_armed,
  ).length;

  const isActive = armedCount > 0;

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <ScreenContainer
      onRefresh={() => assetsQuery.refetch()}
      refreshing={assetsQuery.isRefetching}
    >
      <ScreenHeader
        title="Guardian"
        right={
          <Pressable
            onPress={() => router.push("/(app)/assets")}
          >
            <Text className="text-primary-light text-[14px] font-medium">
              Manage
            </Text>
          </Pressable>
        }
      />

      {/* LOADING */}
      {assetsQuery.isLoading ? <LoadingState /> : null}

      {/* ERROR */}
      {assetsQuery.error ? (
        <ErrorState
          message={(assetsQuery.error as Error).message}
          onRetry={() => assetsQuery.refetch()}
        />
      ) : null}

      {/* CONTENT */}
      {!assetsQuery.isLoading && !assetsQuery.error ? (
        <View className="w-full">
          {/* ------------------------------------------
              GUARDIAN STATUS
          ------------------------------------------- */}
          <View className="w-full items-center py-8 mb-2">
            <ShieldScanner
              active={isActive}
              tone={isActive ? "primary" : "muted"}
              size={128}
            />

            <Text
              className="w-full text-center text-foreground dark:text-white font-semibold text-[18px] mt-5"
              numberOfLines={1}
              adjustsFontSizeToFit={false}
            >
              {isActive
                ? "Guardian Mode is active"
                : "Nothing is armed"}
            </Text>

            <Text
              className="w-full text-center text-muted dark:text-[#8A8D98] mt-1 text-[14px]"
              numberOfLines={2}
            >
              {armedCount} of {assets.length} assets are being monitored
            </Text>
          </View>

          {/* ------------------------------------------
              NO ASSETS
          ------------------------------------------- */}
          {assets.length === 0 ? (
            <EmptyState
              title="No assets to guard"
              message="Add an asset first."
            />
          ) : (
            <Card className="mb-5">
              {assets.map((asset, index) => (
                <ListRow
                  key={asset.id}
                  icon={
                    asset.category === "laptop"
                      ? "monitor"
                      : asset.category === "bag"
                        ? "briefcase"
                        : "file-text"
                  }
                  title={asset.name}
                  subtitle={
                    asset.is_armed
                      ? "Armed · monitoring for movement"
                      : "Not monitored"
                  }
                  isLast={
                    index === assets.length - 1
                  }
                  right={
                    <Switch
                      value={asset.is_armed}
                      disabled={
                        armMutation.isPending &&
                        armMutation.variables?.id === asset.id
                      }
                      onValueChange={(value) =>
                        armMutation.mutate({
                          id: asset.id,
                          is_armed: value,
                        })
                      }
                      trackColor={{
                        false: colors.surfaceAlt,
                        true: colors.primary,
                      }}
                      thumbColor="#FFFFFF"
                    />
                  }
                />
              ))}
            </Card>
          )}

          {/* ------------------------------------------
              DEV TEST ALERT
          ------------------------------------------- */}
          {__DEV__ ? (
            <Pressable
              onPress={() =>
                simulateMutation.mutate()
              }
              disabled={
                armedCount === 0 ||
                simulateMutation.isPending
              }
              className="w-full flex-row items-center justify-center py-3 border border-border dark:border-[#26282F] rounded-xl"
              style={{
                opacity: armedCount === 0 ? 0.4 : 1,
              }}
            >
              <Feather
                name="zap"
                size={16}
                color={colors.mutedLight}
                style={{ marginRight: 8 }}
              />

              <Text className="text-muted-light text-[14px] font-medium">
                {simulateMutation.isPending
                  ? "Simulating…"
                  : armedCount === 0
                    ? "Arm an asset to test alerts"
                    : "[DEV] Simulate a test alert"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </ScreenContainer>
  );
}