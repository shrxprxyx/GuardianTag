import { useSignIn } from "@clerk/expo";
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Shield } from "lucide-react-native";

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loading = fetchStatus === "fetching";

  const onSignIn = async () => {
    await signIn.create({ identifier: email });
    await signIn.password({ password });

    if (signIn.status === "complete") {
      await signIn.finalize();
    }
  };

  return (
    <View className="flex-1 bg-background justify-center px-6">
      <View className="items-center mb-8">
        <View className="w-16 h-16 rounded-2xl bg-accentMuted items-center justify-center mb-3">
          <Shield size={32} color="#2dd4bf" />
        </View>
        <Text className="text-textPrimary text-2xl font-bold">
          Guardian<Text className="text-accent">Tag</Text>
        </Text>
        <Text className="text-textSecondary text-sm mt-1">Sign in to continue</Text>
      </View>

      <View className="bg-surface border border-border rounded-2xl p-4">
        <TextInput
          className="bg-surfaceMuted text-textPrimary p-4 rounded-xl mb-1 border border-border"
          placeholder="Email"
          placeholderTextColor="#6b7280"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        {errors?.fields?.identifier ? (
          <Text className="text-danger text-xs mb-2">{errors.fields.identifier.message}</Text>
        ) : (
          <View className="mb-2" />
        )}

        <TextInput
          className="bg-surfaceMuted text-textPrimary p-4 rounded-xl mb-1 border border-border"
          placeholder="Password"
          placeholderTextColor="#6b7280"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {errors?.fields?.password ? (
          <Text className="text-danger text-xs mb-3">{errors.fields.password.message}</Text>
        ) : (
          <View className="mb-3" />
        )}

        <TouchableOpacity
          className="bg-accent p-4 rounded-xl items-center"
          onPress={onSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0a0a0a" />
          ) : (
            <Text className="text-background font-semibold">Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}