import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { useSignIn } from "@clerk/expo";
import { Link } from "expo-router";
import { useApi } from "@/hooks/useApi";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";

export default function Login() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const api = useApi();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const keyboardHeight = useKeyboardHeight();

  const loading = fetchStatus === "fetching";

  const onSubmit = async () => {
    await signIn.create({ identifier: email });
    await signIn.password({ password });

    if (signIn.status === "complete") {
      await signIn.finalize();
      // Safety net in case the Clerk webhook hasn't synced this profile yet.
      // /auth/sync only creates when missing, so this never clobbers an existing profile.
      await api.post("/auth/sync", { email, full_name: email });
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="flex-grow justify-center px-6"
      contentContainerStyle={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + 24 : 0 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-3xl font-extrabold text-white mb-1">Welcome back</Text>
      <Text className="text-muted mb-8">Sign in to keep watch over your devices.</Text>

      <TextInput
        className="bg-surface text-white rounded-xl px-4 py-3 mb-1 border border-border"
        placeholder="Email"
        placeholderTextColor="#8B8B9E"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {errors?.fields?.identifier ? (
        <Text className="text-emergency text-xs mb-2">{errors.fields.identifier.message}</Text>
      ) : (
        <View className="mb-2" />
      )}

      <TextInput
        className="bg-surface text-white rounded-xl px-4 py-3 mb-1 border border-border"
        placeholder="Password"
        placeholderTextColor="#8B8B9E"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {errors?.fields?.password ? (
        <Text className="text-emergency text-xs mb-3">{errors.fields.password.message}</Text>
      ) : (
        <View className="mb-3" />
      )}

      <Pressable
        onPress={onSubmit}
        disabled={loading}
        style={{
          width: "100%",
          height: 52,
          backgroundColor: "#69D7B8",
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          paddingHorizontal: 20,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 16,
              fontWeight: "600",
              textAlign: "center",
              width: "100%",
            }}
          >
            Sign In
          </Text>
        )}
      </Pressable>

      <Link href="/(auth)/register" className="text-center text-primary-light">
        Don&apos;t have an account? Register
      </Link>
    </ScrollView>
  );
}