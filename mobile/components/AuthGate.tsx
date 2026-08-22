import { useEffect, useRef } from "react";
import { View } from "react-native";
import { useAuth, useUser } from "@clerk/expo";
import { useRouter, useSegments } from "expo-router";
import { useApi } from "@/hooks/useApi";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const segments = useSegments();
  const router = useRouter();
  const api = useApi();
  const hasSynced = useRef(false);

  // Safety net for a signed-in Clerk session whose backend profile doesn't
  // exist - e.g. after a dev database reset. login.tsx/register.tsx already
  // call /auth/sync right after their own sign-in/sign-up, but that only
  // fires during that specific action - a session resumed on app relaunch
  // never re-runs it. /auth/sync only creates when missing, so calling it
  // again here is always safe. Runs once per signed-in session (not on every
  // render) via the ref guard.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || hasSynced.current) return;
    hasSynced.current = true;

    const email = user.primaryEmailAddress?.emailAddress ?? "";
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || email;

    api.post("/auth/sync", { email, full_name: fullName }).catch(() => {
      // If this fails (e.g. backend briefly unreachable), allow a retry on
      // the next mount rather than silently giving up for the whole session.
      hasSynced.current = false;
    });
  }, [isLoaded, isSignedIn, user, api]);

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