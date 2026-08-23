import { useState } from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { ListRow } from "@/components/ui/ListRow";
import { colors } from "@/constants/theme";

const FAQS: { question: string; answer: string }[] = [
  {
    question: "How does Guardian mode work?",
    answer:
      "Arm Guardian mode from the Guard tab before you leave a device unattended. If a paired tag detects motion or a magnetic-seal break while armed, GuardianTag opens an incident and alerts you.",
  },
  {
    question: "Why does a device show 'Degraded signal'?",
    answer:
      "The tag hasn't checked in recently or its battery is low. Bring your phone within Bluetooth range or check the device's battery to restore a normal connection.",
  },
  {
    question: "What happens when I disarm quickly after a trigger?",
    answer:
      "If you disarm within the grace window, the incident auto-resolves as a false alarm and you still earn XP for the quick response.",
  },
  {
    question: "How do I connect Telegram alerts?",
    answer: "Go to Settings → Telegram alerts and tap Connect. This opens Telegram to link your chat.",
  },
];

export default function Help() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <ScreenContainer>
      <ScreenHeader title="Help & support" showBack />

      <Card className="mb-6">
        <ListRow
          icon="mail"
          title="Email support"
          subtitle="support@guardiantag.app"
          showChevron
          onPress={() => Linking.openURL("mailto:support@guardiantag.app")}
        />
        <ListRow
          icon="send"
          title="Report a bug"
          subtitle="Tell us what went wrong"
          showChevron
          isLast
          onPress={() => Linking.openURL("mailto:support@guardiantag.app?subject=Bug%20report")}
        />
      </Card>

      <Text className="text-foreground dark:text-white font-semibold text-[15px] mb-2">
        Frequently asked
      </Text>
      <Card className="mb-6">
        {FAQS.map((faq, i) => {
          const open = openIndex === i;
          return (
            <View key={faq.question} className={i === FAQS.length - 1 ? "" : "border-b border-hairline"}>
              <Pressable
                onPress={() => setOpenIndex(open ? null : i)}
                className="flex-row items-center justify-between py-3.5"
              >
                <Text className="text-foreground dark:text-white text-[14px] flex-1 mr-3 font-medium">
                  {faq.question}
                </Text>
                <Feather name={open ? "chevron-up" : "chevron-down"} size={16} color={colors.muted} />
              </Pressable>
              {open ? (
                <Text className="text-muted dark:text-[#8A8D98] text-[13px] leading-5 pb-3.5">
                  {faq.answer}
                </Text>
              ) : null}
            </View>
          );
        })}
      </Card>
    </ScreenContainer>
  );
}