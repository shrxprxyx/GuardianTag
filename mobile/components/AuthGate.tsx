import { useEffect } from "react";
import { View } from "react-native";
import { useAuth } from "@clerk/expo";
import { useRouter, useSegments } from "expo-router";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const segment: string | undefined = segments[0];
    const inAuthGroup = segment === "(auth)";
    const inAppGroup = segment === "(app)";
    const atRoot = segment === undefined;

    // DEV-ONLY: always land on onboarding on load, and never auto-bounce a
    // signed-in user away from (auth) routes, so login/register/onboarding
    // stay reachable for testing. __DEV__ is false in production builds,
    // so this block is automatically inert there - nothing to remember to
    // revert later.
    if (__DEV__) {
      if (atRoot) {
        router.replace("/(auth)/onboarding");
        return;
      }
      if (!isSignedIn && inAppGroup) {
        router.replace("/(auth)/login");
      }
      return;
    }

    if (!isSignedIn && inAppGroup) {
      router.replace("/(auth)/login");
    } else if (isSignedIn && (inAuthGroup || atRoot)) {
      router.replace("/(app)/home");
    } else if (!isSignedIn && atRoot) {
      router.replace("/(auth)/onboarding");
    }
  }, [isLoaded, isSignedIn, segments, router]);

  if (!isLoaded) {
    return <View className="flex-1 bg-background" />;
  }

  return <>{children}</>;
}