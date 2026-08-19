import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useSignUp } from "@clerk/expo";
import { Link } from "expo-router";
import { useApi } from "@/hooks/useApi";

export default function Register() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const api = useApi();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const loading = fetchStatus === "fetching";

  const onSubmit = async () => {
    const [firstName, ...rest] = fullName.trim().split(" ");
    await signUp.create({
      emailAddress: email,
      password,
      firstName,
      lastName: rest.join(" ") || undefined,
    });
    await signUp.verifications.sendEmailCode();
    setPendingVerification(true);
  };

  const onVerify = async () => {
    setVerifyError(null);
    await signUp.verifications.verifyEmailCode({ code });

    if (signUp.status === "complete") {
      await signUp.finalize();
      await api.post("/auth/sync", { email, full_name: fullName });
    } else {
      setVerifyError("Verification incomplete. Please try again.");
    }
  };

  if (pendingVerification) {
    return (
      <View className="flex-1 bg-background px-6 justify-center">
        <Text className="text-3xl font-extrabold text-white mb-1">Check your email</Text>
        <Text className="text-muted mb-8">Enter the verification code we sent to {email}.</Text>

        <TextInput
          className="bg-surface text-white rounded-xl px-4 py-3 mb-3 border border-border"
          placeholder="Verification code"
          placeholderTextColor="#8B8B9E"
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
        />

        {verifyError ? <Text className="text-emergency mb-3">{verifyError}</Text> : null}

        <Pressable
          className="bg-primary rounded-xl py-3 items-center"
          onPress={onVerify}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-semibold">Verify</Text>}
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-6 justify-center">
      <Text className="text-3xl font-extrabold text-white mb-1">Create account</Text>
      <Text className="text-muted mb-8">Guard your devices from day one.</Text>

      <TextInput
        className="bg-surface text-white rounded-xl px-4 py-3 mb-3 border border-border"
        placeholder="Full name"
        placeholderTextColor="#8B8B9E"
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        className="bg-surface text-white rounded-xl px-4 py-3 mb-1 border border-border"
        placeholder="Email"
        placeholderTextColor="#8B8B9E"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {errors?.fields?.emailAddress ? (
        <Text className="text-emergency text-xs mb-2">{errors.fields.emailAddress.message}</Text>
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
        className="bg-primary rounded-xl py-3 items-center mb-4"
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-semibold">Create Account</Text>}
      </Pressable>

      <Link href="/(auth)/login" className="text-center text-primary-light">
        Already have an account? Sign in
      </Link>
    </View>
  );
}
