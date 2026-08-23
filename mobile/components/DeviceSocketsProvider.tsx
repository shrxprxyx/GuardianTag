import { useEffect, useMemo, useRef } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@clerk/expo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { openDeviceSocket, type DeviceSocketMessage } from "@/lib/ws/deviceSocket";
import type { Device } from "@/types/api";

/**
 * Keeps one live WebSocket per paired device for the lifetime of the signed-in
 * session, so incident/device-health changes reach the UI without the user
 * needing to pull-to-refresh. Mount once, near the root, alongside AuthGate.
 */
export function DeviceSocketsProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, getToken } = useAuth();
  const api = useApi();
  const queryClient = useQueryClient();

  const devicesQuery = useQuery({
    queryKey: ["devices"],
    queryFn: () => api.get<Device[]>("/devices"),
    enabled: !!isSignedIn,
  });

  // getToken's own identity isn't something the effect below should ever
  // need to react to - a ref means the effect always calls whichever
  // version is current without needing it in its dependency array.
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  // A stable string of device IDs, not the raw query array. The message
  // handler below invalidates ["devices"] on incoming sensor_event/
  // device_health messages, which refetches and produces a brand-new array
  // reference every time even when the actual device set is unchanged - if
  // the effect depended on that array directly, every single incoming
  // message would tear down and reopen ALL sockets, in a self-feeding loop
  // (this was actually happening: rapid close/reconnect churn, occasionally
  // catching a Clerk token mid-expiry and getting rejected with a 403).
  // Depending on this derived, content-stable string instead means sockets
  // only reopen when devices are actually paired or removed.
  const deviceIds = useMemo(
    () => (devicesQuery.data ?? []).map((d) => d.id).sort().join(","),
    [devicesQuery.data],
  );

  useEffect(() => {
    if (!isSignedIn || !deviceIds) return;

    const handleMessage = (message: DeviceSocketMessage) => {
      switch (message.type) {
        case "sensor_event":
          queryClient.invalidateQueries({ queryKey: ["devices"] });
          break;
        case "device_health":
          queryClient.invalidateQueries({ queryKey: ["devices"] });
          break;
        case "incident_created":
          queryClient.invalidateQueries({ queryKey: ["incidents"] });
          Alert.alert(
            "GuardianTag Alert",
            (message.incident.title as string) ?? "Unverified movement detected",
            [
              { text: "Dismiss", style: "cancel" },
              { text: "View", onPress: () => router.push("/(app)/emergency-alert") },
            ],
          );
          break;
        case "incident_updated":
          queryClient.invalidateQueries({ queryKey: ["incidents"] });
          break;
      }
    };

    const cleanups = deviceIds
      .split(",")
      .map((id) => openDeviceSocket(id, () => getTokenRef.current(), handleMessage));

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [isSignedIn, deviceIds, queryClient]);

  return <>{children}</>;
}