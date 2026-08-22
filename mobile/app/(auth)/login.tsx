import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSignIn, useAuth } from "@clerk/expo";
import { Link, router } from "expo-router";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";

export default function Login() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { isSignedIn, signOut } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const keyboardHeight = useKeyboardHeight();
  const loading = fetchStatus === "fetching";

  const onSubmit = async () => {
    setFormError(null);

    try {
      const { error } = await signIn.password({
        emailAddress: email.trim(),
        password,
      });

      if (error) {
        setFormError(
          error.longMessage ||
            error.message ||
            "Sign in failed. Check your details and try again."
        );
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize();

        // Profile sync happens centrally in AuthGate.
        router.replace("/(app)/home");
      }
    } catch (error: any) {
      console.error("Login error:", error);

      setFormError(
        error?.longMessage ||
          error?.message ||
          "Sign in failed. Check your details and try again."
      );
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="flex-grow justify-center px-6"
      contentContainerStyle={{
        paddingBottom:
          keyboardHeight > 0 ? keyboardHeight + 24 : 0,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-3xl font-extrabold text-white mb-1">
        Welcome back
      </Text>

      <Text className="text-muted mb-8">
        Sign in to keep watch over your devices.
      </Text>

      {/* DEV-ONLY sign out */}
      {__DEV__ && isSignedIn ? (
        <Pressable
          onPress={() => signOut()}
          className="bg-surface-alt border border-border rounded-xl py-2.5 items-center mb-6"
        >
          <Text className="text-emergency-light text-[13px] font-medium">
            [DEV] Currently signed in - tap to sign out
          </Text>
        </Pressable>
      ) : null}

      {/* Email */}
      <TextInput
        className="bg-surface text-white rounded-xl px-4 py-3 mb-1 border border-border"
        placeholder="Email"
        placeholderTextColor="#8B8B9E"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setFormError(null);
        }}
      />

      {errors?.fields?.identifier ? (
        <Text className="text-emergency text-xs mb-2">
          {errors.fields.identifier.message}
        </Text>
      ) : (
        <View className="mb-2" />
      )}

      {/* Password */}
      <TextInput
        className="bg-surface text-white rounded-xl px-4 py-3 mb-1 border border-border"
        placeholder="Password"
        placeholderTextColor="#8B8B9E"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setFormError(null);
        }}
      />

      {errors?.fields?.password ? (
        <Text className="text-emergency text-xs mb-3">
          {errors.fields.password.message}
        </Text>
      ) : (
        <View className="mb-3" />
      )}

      {/* General error */}
      {formError ? (
        <Text className="text-emergency text-sm mb-3">
          {formError}
        </Text>
      ) : null}

      {/* Sign In button */}
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

      {/* Register */}
      <Link
        href="/(auth)/register"
        className="text-center text-primary-light"
      >
        Don&apos;t have an account? Register
      </Link>
    </ScrollView>
  );
}