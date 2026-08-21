import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { setToken } from "@/services/storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function SignupScreen() {
  const router = useRouter();
  const { addToast } = useToast();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password) {
      addToast("Please fill in all fields", "warning");
      return;
    }
    if (password !== confirmPassword) {
      addToast("Passwords don't match", "error");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        addToast(data.message || "Could not create account", "error");
        return;
      }

      if (data.token && data.user) {
        await setToken(data.token);
        login(data.user);
      }

      addToast("Account created successfully", "success");
      router.replace("/");
    } catch (error) {
      console.error("Sign up failed:", error);
      addToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Sign up to start browsing NIT KKR PYQs
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name"
            placeholderTextColor="#777"
            style={styles.input}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor="#777"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            placeholderTextColor="#777"
            secureTextEntry
            style={styles.input}
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            placeholderTextColor="#777"
            secureTextEntry
            style={styles.input}
          />

          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitText}>
              {loading ? "Creating account..." : "Sign up"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <Pressable onPress={() => router.replace("/login")}>
            <Text style={styles.loginLink}>Login</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>
          By continuing, you agree to our Terms and Privacy Policy.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#09090B" },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    maxWidth: 500,
    width: "100%",
    alignSelf: "center",
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    marginTop: 12,
    alignSelf: "flex-start",
  },
  closeText: { color: "#FFFFFF", fontSize: 28, fontWeight: "300", lineHeight: 30 },

  header: { marginTop: 35, marginBottom: 32 },
  title: { color: "#FFFFFF", fontSize: 32, fontWeight: "700", letterSpacing: -0.7 },
  subtitle: { color: "#8E8E93", fontSize: 15, marginTop: 9, lineHeight: 22 },

  form: { width: "100%" },
  label: { color: "#D7D7DA", fontSize: 13, fontWeight: "500", marginBottom: 8 },
  input: {
    width: "100%",
    height: 52,
    backgroundColor: "#151518",
    borderWidth: 1,
    borderColor: "#29292D",
    borderRadius: 13,
    paddingHorizontal: 15,
    color: "#FFFFFF",
    fontSize: 15,
    marginBottom: 18,
    outlineStyle: "none",
  },

  submitButton: {
    height: 52,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  submitText: { color: "#09090B", fontSize: 15, fontWeight: "700" },
  buttonPressed: { opacity: 0.7 },
  buttonDisabled: { opacity: 0.5 },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
    gap: 5,
  },
  loginText: { color: "#77777D", fontSize: 14 },
  loginLink: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },

  footer: {
    color: "#55555B",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 17,
    marginTop: 30,
    marginBottom: 20,
  },
});
