import { useToast } from "@/contexts/ToastContext";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { addToast } = useToast();

  const [step, setStep] = useState("email"); // email | otp | password
  const [email, setEmail] = useState("");
  const [values, setValues] = useState(Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef([]);

  const handleOtpChange = (text, index) => {
    if (text !== "" && isNaN(text)) return;
    const next = [...values];
    next[index] = text.slice(-1);
    setValues(next);
    if (text !== "" && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && values[index] === "" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const sendOtp = async () => {
    if (!email.trim()) {
      addToast("Enter your email address", "warning");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/forgotpassword`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ EmailID: email }),
        },
      );

      if (response.status === 200) {
        setStep("otp");
      } else if (response.status === 208) {
        setStep("password");
      } else {
        addToast("Could not send verification code", "error");
      }
    } catch (error) {
      console.error("sendOtp failed:", error);
      addToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const otp = parseInt(values.join(""), 10);
    if (Number.isNaN(otp) || values.some((v) => v === "")) {
      addToast("Enter the full 6-digit code", "warning");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/otp-verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ EmailID: email, otp }),
        },
      );

      if (response.status === 200) {
        setStep("password");
      } else {
        addToast("Incorrect or expired code", "error");
      }
    } catch (error) {
      console.error("verifyOtp failed:", error);
      addToast("Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (!password || password !== confirmPassword) {
      addToast("Passwords don't match", "error");
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/resetpassword`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ EmailID: email, pass: password }),
        },
      );

      if (response.status === 200) {
        addToast("Password changed successfully", "success");
        router.replace("/login");
      } else {
        addToast("Could not reset password. Try again.", "error");
      }
    } catch (error) {
      console.error("changePassword failed:", error);
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

        {step === "email" && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                Enter your email and we&apos;ll send you a verification code
              </Text>
            </View>
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
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={sendOtp}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? "Sending..." : "Send Verification Code"}
              </Text>
            </Pressable>
          </>
        )}

        {step === "otp" && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Verification Code</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to {email}
              </Text>
            </View>
            <View style={styles.otpRow}>
              {values.map((val, index) => (
                <TextInput
                  key={index}
                  ref={(el) => (inputsRef.current[index] = el)}
                  value={val}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleOtpKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={styles.otpBox}
                />
              ))}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={verifyOtp}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? "Verifying..." : "Verify"}
              </Text>
            </Pressable>
          </>
        )}

        {step === "password" && (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>New Password</Text>
              <Text style={styles.subtitle}>Choose a new password for your account</Text>
            </View>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter new password"
              placeholderTextColor="#777"
              secureTextEntry
              style={styles.input}
            />
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              placeholderTextColor="#777"
              secureTextEntry
              style={styles.input}
            />
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={changePassword}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? "Saving..." : "Change Password"}
              </Text>
            </Pressable>
          </>
        )}
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
  title: { color: "#FFFFFF", fontSize: 28, fontWeight: "700", letterSpacing: -0.5 },
  subtitle: { color: "#8E8E93", fontSize: 14, marginTop: 9, lineHeight: 21 },

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

  otpRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 26 },
  otpBox: {
    width: 44,
    height: 54,
    borderRadius: 12,
    backgroundColor: "#151518",
    borderWidth: 1,
    borderColor: "#29292D",
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },

  primaryButton: {
    height: 52,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryButtonText: { color: "#09090B", fontSize: 15, fontWeight: "700" },
  buttonPressed: { opacity: 0.7 },
  buttonDisabled: { opacity: 0.5 },
});
