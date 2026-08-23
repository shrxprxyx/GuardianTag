import {
  Pressable,
  Text,
  ActivityIndicator,
} from "react-native";

export type ButtonVariant =
  | "primary"
  | "danger"
  | "secondary"
  | "ghost";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  danger: "bg-emergency",
  secondary:
    "bg-surface-alt dark:bg-[#1B1D24] border border-border",
  ghost: "bg-transparent",
};

const textClasses: Record<ButtonVariant, string> = {
  primary: "text-white",
  danger: "text-white",
  secondary: "text-white",
  ghost: "text-primary-light",
};

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`w-full rounded-xl py-3.5 px-4 items-center justify-center ${
        variantClasses[variant]
      } ${isDisabled ? "opacity-40" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text
          className={textClasses[variant]}
          numberOfLines={1}
          style={{
            fontSize: 15,
            fontWeight: "600",
            textAlign: "center",
            minWidth: 110,
            flexShrink: 0,
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}