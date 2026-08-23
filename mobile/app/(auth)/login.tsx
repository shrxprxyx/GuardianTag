import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import { useSignIn, useAuth } from "@clerk/expo";
import { Link, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { BrandHeader } from "@/components/ui/BrandHeader";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";

export default function Login() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { isSignedIn, signOut } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      <View className="items-center mb-8">
        <BrandHeader size={40} />
        <Text className="text-xl font-bold text-white mt-4 mb-1">
          Welcome to GuardianTag
        </Text>
        <Text className="text-muted">Sign in to continue</Text>
      </View>

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
      <View className="relative justify-center mb-1">
        <TextInput
          className="bg-surface text-white rounded-xl px-4 py-3 pr-11 border border-border"
          placeholder="Password"
          placeholderTextColor="#8B8B9E"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setFormError(null);
          }}
        />
        <Pressable
          onPress={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 h-full justify-center px-1"
          hitSlop={8}
        >
          <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.muted} />
        </Pressable>
      </View>

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
      <View className="mb-4">
        <Button label="Sign In" onPress={onSubmit} loading={loading} disabled={loading} />
      </View>

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