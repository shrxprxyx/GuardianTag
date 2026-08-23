import { View, Text, Image } from "react-native";

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        width: size + size * 0.06 + size * 2.8,
        minWidth: size + size * 0.06 + size * 2.8,
      }}
    >
      <Image
        source={require("@/assets/images/symbol.png")}
        style={{
          width: size,
          height: size,
          resizeMode: "contain",
        }}
      />

      <Text
        style={{
          marginLeft: size * 0.06,
          width: size * 2.8,
          minWidth: size * 2.8,
          fontSize: size * 0.44,
          fontWeight: "800",
          letterSpacing: -0.3,
          includeFontPadding: false,
          flexShrink: 0,
          color: "#F1F5F3",
        }}
        numberOfLines={1}
      >
        Guardian
        <Text style={{ color: "#69D7B8" }}>Tag</Text>
      </Text>
    </View>
  );
}