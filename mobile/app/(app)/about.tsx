import { View, Text, Linking } from "react-native";
import Constants from "expo-constants";
import { Feather } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { Logo } from "@/components/ui/Logo";

export default function About() {
  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <ScreenContainer>
      <ScreenHeader title="About" showBack />

      <View className="items-center my-6">
        <Logo size={48} />
        <Text className="text-muted dark:text-[#8A8D98] text-[13px] mt-3">Version {version}</Text>
      </View>

      <Text className="text-foreground dark:text-white text-[14px] text-center leading-5 mb-6 px-2">
        GuardianTag watches over your bags and devices with hall-sensor and motion detection,
        turning a quiet tag into an instant alert the moment something's off.
      </Text>

      <Card className="mb-6">
        <ListRow icon="shield" title="Guardian-mode monitoring" subtitle="Real-time device protection" isLast />
      </Card>

      <Card className="mb-6">
        <ListRow
          icon="file-text"
          title="Terms of Service"
          showChevron
          onPress={() => Linking.openURL("https://guardiantag.app/terms")}
        />
        <ListRow
          icon="lock"
          title="Privacy Policy"
          showChevron
          isLast
          onPress={() => Linking.openURL("https://guardiantag.app/privacy")}
        />
      </Card>

      <View className="items-center mb-4">
        <View className="flex-row items-center">
          <Feather name="heart" size={12} color="#69D7B8" />
          <Text className="text-muted dark:text-[#8A8D98] text-[12px] ml-1.5">
            Built to keep your gear safe
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}