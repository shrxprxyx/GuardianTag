import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useSignUp } from "@clerk/expo";
import { Link, router } from "expo-router";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";

export default function Register() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const keyboardHeight = useKeyboardHeight();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const loading = fetchStatus === "fetching";

  const onSubmit = async () => {
    try {
      const [firstName, ...rest] = fullName.trim().split(" ");

      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName: rest.join(" ") || undefined,
      });

      await signUp.verifications.sendEmailCode();
      setPendingVerification(true);
    } catch (error) {
      console.log("Sign up error:", error);
    }
  };

  const onVerify = async () => {
    try {
      setVerifyError(null);

      await signUp.verifications.verifyEmailCode({ code });

      if (signUp.status === "complete") {
        await signUp.finalize();
        // Profile sync now happens centrally in AuthGate as soon as it
        // detects a signed-in session, so there's no need to call
        // /auth/sync here too - doing both was causing a race between the
        // two concurrent calls.
        router.replace("/(app)/home");
      } else {
        setVerifyError("Verification incomplete. Please try again.");
      }
    } catch (error: any) {
      console.log("Verification error:", error);
      setVerifyError(
        error?.errors?.[0]?.message ||
        "Invalid verification code. Please try again."
      );
    }
  };

  // -----------------------------
  // EMAIL VERIFICATION SCREEN
  // -----------------------------
  if (pendingVerification) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="flex-grow justify-center px-6 py-8"
        contentContainerStyle={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + 24 : 0 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-extrabold text-white mb-1">
          Check your email
        </Text>

        <Text className="text-muted mb-8">
          Enter the verification code we sent to {email}.
        </Text>

        <TextInput
          className="bg-surface text-white rounded-xl px-4 py-3 mb-3 border border-border"
          placeholder="Verification code"
          placeholderTextColor="#8B8B9E"
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
        />

        {verifyError ? (
          <Text className="text-emergency mb-3">
            {verifyError}
          </Text>
        ) : null}

        <Pressable
          className="w-full bg-primary rounded-xl py-3 px-4 items-center justify-center"
          onPress={onVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-center">
              Verify
            </Text>
          )}
        </Pressable>
      </ScrollView>
    );
  }

  // -----------------------------
  // REGISTRATION SCREEN
  // -----------------------------
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="flex-grow justify-center px-6 py-8"
      contentContainerStyle={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + 24 : 0 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-3xl font-extrabold text-center text-white mb-1">
        Create Account
      </Text>

      <Text className="text-muted text-center mb-8">
        Guard your devices from day one.
      </Text>

      {/* Full Name */}
      <TextInput
        className="bg-surface text-white rounded-xl px-4 py-3 mb-3 border border-border"
        placeholder="Full name"
        placeholderTextColor="#8B8B9E"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
      />

      {/* Email */}
      <TextInput
        className="bg-surface text-white rounded-xl px-4 py-3 mb-1 border border-border"
        placeholder="Email"
        placeholderTextColor="#8B8B9E"
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />

      {errors?.fields?.emailAddress ? (
        <Text className="text-emergency text-xs mb-2">
          {errors.fields.emailAddress.message}
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
        value={password}
        onChangeText={setPassword}
      />

      {errors?.fields?.password ? (
        <Text className="text-emergency text-xs mb-3">
          {errors.fields.password.message}
        </Text>
      ) : (
        <View className="mb-3" />
      )}

      {/* Create Account Button */}
      <Pressable
        onPress={onSubmit}
        disabled={loading}
        style={{
          width: "100%",
          height: 52,
          backgroundColor: '#69D7B8',
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
            Create Account
          </Text>
        )}
      </Pressable>
      <View
        nativeID="clerk-captcha"
        style={{ minHeight: 1 }}
      />

      {/* Login Link */}
      <Link
        href="/(auth)/login"
        className="text-center text-primary-light"
      >
        Already have an account? Sign in
      </Link>
    </ScrollView>
  );
}