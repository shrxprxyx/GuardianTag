import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

export default function Onboarding() {
  return (
    <View className="flex-1 bg-background px-6 justify-between py-16">
      {/* Top spacer */}
      <View />

      {/* Center content */}
      <View className="items-center">
        <View className="mb-4">
          <Logo size={44} />
        </View>

        <Text
          className="text-white text-lg text-center mb-2"
          style={{ alignSelf: "stretch" }}
        >
          Your bags, guarded around the clock.
        </Text>

        <Text
          className="text-muted text-center"
          style={{ alignSelf: "stretch" }}
        >
          Hall-sensor and motion detection, instant alerts, and a live event
          history — even when your phone is asleep.
        </Text>
      </View>

      {/* Bottom actions */}
      <View style={{ alignSelf: "stretch" }}>
        <View style={{ alignSelf: "stretch", marginBottom: 12 }}>
          <Button
            label="Get Started"
            onPress={() => router.push("/(auth)/register")}
          />
        </View>

        <Pressable
          style={{
            alignSelf: "stretch",
            paddingVertical: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text className="text-primary-light">
            I already have an account
          </Text>
        </Pressable>
      </View>
    </View>
  );
}