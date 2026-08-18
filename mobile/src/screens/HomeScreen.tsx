import { useUser } from "@clerk/expo";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Shield, ShieldAlert, Wifi } from "lucide-react-native";

export default function HomeScreen() {
  const { user } = useUser();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20 }}>
      <Text className="text-textSecondary text-sm">Welcome back</Text>
      <Text className="text-textPrimary text-2xl font-bold mb-5">
        {user?.firstName ?? user?.primaryEmailAddress?.emailAddress}
      </Text>

      <View className="flex-row gap-3 mb-5">
        <View className="flex-1 bg-surface border border-border rounded-2xl p-4">
          <Text className="text-accent text-2xl font-bold">2</Text>
          <Text className="text-textSecondary text-xs mt-1">Devices armed</Text>
        </View>
        <View className="flex-1 bg-surface border border-border rounded-2xl p-4">
          <Text className="text-warning text-2xl font-bold">1</Text>
          <Text className="text-textSecondary text-xs mt-1">Open alert</Text>
        </View>
      </View>

      <Text className="text-textPrimary font-semibold mb-3">Your devices</Text>

      <TouchableOpacity className="bg-surface border border-border rounded-2xl p-4 flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-accentMuted items-center justify-center">
            <Shield size={18} color="#2dd4bf" />
          </View>
          <View>
            <Text className="text-textPrimary font-medium">Backpack Node</Text>
            <Text className="text-textSecondary text-xs">Armed · Online</Text>
          </View>
        </View>
        <View className="w-2 h-2 rounded-full bg-accent" />
      </TouchableOpacity>

      <TouchableOpacity className="bg-surface border border-border rounded-2xl p-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-surfaceMuted items-center justify-center">
            <ShieldAlert size={18} color="#facc15" />
          </View>
          <View>
            <Text className="text-textPrimary font-medium">Laptop Node</Text>
            <Text className="text-textSecondary text-xs">Disarmed · Wi-Fi weak</Text>
          </View>
        </View>
        <Wifi size={16} color="#facc15" />
      </TouchableOpacity>
    </ScrollView>
  );
}