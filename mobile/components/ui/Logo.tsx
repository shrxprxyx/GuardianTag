import { View, Text, Image } from "react-native";

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <View className="flex-row items-center">
      <Image
        source={require("@/assets/images/symbol.png")}
        style={{ width: size, height: size, resizeMode: "contain" }}
      />
      <Text
        style={{ fontSize: size * 0.44, marginLeft: size * 0.06, fontWeight: "800", letterSpacing: -0.3 }}
      >
        <Text style={{ color: "#F1F5F3" }}>Guardian</Text>
        <Text style={{ color: "#69D7B8" }}>Tag</Text>
      </Text>
    </View>
  );
}