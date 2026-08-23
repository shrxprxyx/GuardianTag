import { View, Text, Pressable} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, usePathname, type Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";

const TABS: {
  key: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  href: Href;
}[] = [
  {
    key: "home",
    label: "Home",
    icon: "home",
    href: "/(app)/home",
  },
  {
    key: "guardian",
    label: "Guardian",
    icon: "shield",
    href: "/(app)/guardian-mode",
  },
  {
    key: "incidents",
    label: "Incidents",
    icon: "alert-triangle",
    href: "/(app)/incidents/index",
  },
  {
    key: "profile",
    label: "Profile",
    icon: "user",
    href: "/(app)/profile",
  },
];

const ROOT_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/onboarding",
  "/notifications",
]);

export function BottomTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  if (ROOT_PATHS.has(pathname)) {
    return null;
  }

  return (
    <View
      className="absolute left-0 right-0 bottom-0 bg-background border-t border-border"
      style={{
        paddingBottom: Math.max(insets.bottom, 8),
      }}
    >
      <View className="flex-row">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href ||
            pathname.startsWith(`${tab.href}/`);

          const color = active ? colors.primary : colors.muted;

          return (
            <Pressable
              key={tab.key}
              onPress={() => {
                if (!active) {
                  router.replace(tab.href);
                }
              }}
              className="flex-1 items-center py-2.5"
            >
              <Feather
                name={tab.icon}
                size={22}
                color={color}
              />

              <Text
                className="text-[11px] mt-1"
                style={{
                  color,
                  fontWeight: active ? "600" : "500",
                }}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}