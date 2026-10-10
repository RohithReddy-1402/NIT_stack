import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { getToken } from "@/services/storage";
import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle2, MailCheck, RefreshCw } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RESEND_COOLDOWN = 30;
const POLL_INTERVAL_MS = 4000;

export default function VerifyEmailScreen() {
  const { email, reason = "signup" } = useLocalSearchParams();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { addToast } = useToast();
  const { refreshSession } = useAuth();

  const [verified, setVerified] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [hasToken, setHasToken] = useState(false);
  const pollRef = useRef(null);

  const markVerified = useCallback(() => {
    setVerified(true);
    addToast("Email verified", "success");
    clearInterval(pollRef.current);
    setTimeout(async () => {
      await refreshSession();
      router.replace("/");
    }, 1600);
  }, [addToast, refreshSession]);

  useEffect(() => {
    let active = true;
    (async () => {
      const token = await getToken();
      if (!active) return;
      setHasToken(!!token);
      if (!token) return;

      const checkStatus = async () => {
        try {
          const res = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/email-verification/status`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (!res.ok) return;
          const data = await res.json();
          if (data?.emailVerified && active) markVerified();
        } catch {
          // Transient network hiccup — the next poll tick will retry.
        }
      };

      checkStatus();
      pollRef.current = setInterval(checkStatus, POLL_INTERVAL_MS);
    })();

    return () => {
      active = false;
      clearInterval(pollRef.current);
    };
  }, [markVerified]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleResend = async () => {
    if (sending || cooldown > 0) return;
    if (!email) {
      addToast("No email address to resend to", "warning");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/email-verification/resend`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ EmailID: email }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (res.status === 200) {
        addToast("Verification email sent", "success");
        setCooldown(RESEND_COOLDOWN);
      } else if (res.status === 208) {
        markVerified();
      } else if (res.status === 404) {
        addToast("No account found with that email", "error");
      } else if (res.status === 429) {
        setCooldown(data.retryAfter || 15 * 60);
        addToast(
          data.message || "Too many requests. Please try again later.",
          "warning",
        );
      } else {
        addToast(
          data.message || "Could not send the email. Please try again.",
          "error",
        );
      }
    } catch {
      addToast("Network error or server down", "error");
    } finally {
      setSending(false);
    }
  };

  const formatWait = (s) => (s >= 60 ? `${Math.ceil(s / 60)} min` : `${s}s`);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.content}>
        {verified ? (
          <View style={styles.centerBlock}>
            <View style={styles.iconCircleSuccess}>
              <CheckCircle2 size={30} color={colors.accent} strokeWidth={1.75} />
            </View>
            <Text style={styles.title}>Email verified</Text>
            <Text style={styles.subtitle}>
              You&apos;re all set. Taking you back to the app…
            </Text>
            <ActivityIndicator
              style={{ marginTop: 16 }}
              color={colors.accent}
            />
          </View>
        ) : (
          <View style={styles.centerBlock}>
            <View style={styles.iconCircle}>
              <MailCheck size={30} color={colors.accent} strokeWidth={1.75} />
            </View>
            <Text style={styles.title}>
              {reason === "login" ? "Verify your email" : "Check your email"}
            </Text>
            <Text style={styles.subtitle}>
              {reason === "login"
                ? "This account hasn't been verified yet. Open the link we sent to "
                : "We sent a verification link to "}
              <Text style={styles.emailText}>{email}</Text>
              {reason === "login" ? " to sign in." : "."}
            </Text>

            <Text style={styles.hint}>
              {hasToken
                ? "Keep the app open — it updates automatically the moment you click the link."
                : "Once verified, sign in again with your email and password."}
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.resendButton,
                pressed && styles.buttonPressed,
                (sending || cooldown > 0) && styles.buttonDisabled,
              ]}
              onPress={handleResend}
              disabled={sending || cooldown > 0}
            >
              <RefreshCw size={16} color={colors.void} strokeWidth={2} />
              <Text style={styles.resendText}>
                {cooldown > 0
                  ? `Resend in ${formatWait(cooldown)}`
                  : sending
                    ? "Sending…"
                    : "Resend email"}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.laterButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() =>
                router.replace(reason === "login" ? "/login" : "/")
              }
            >
              <Text style={styles.laterText}>
                {reason === "login" ? "Back to sign in" : "I'll do it later"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    centerBlock: { alignItems: "center", maxWidth: 340 },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.onyxRaised,
      borderWidth: 1,
      borderColor: colors.hairline,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    iconCircleSuccess: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.onyxRaised,
      borderWidth: 1,
      borderColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    title: {
      color: colors.chrome,
      fontSize: 20,
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 10,
    },
    subtitle: {
      color: colors.silver,
      fontSize: 14,
      lineHeight: 21,
      textAlign: "center",
    },
    emailText: { color: colors.chrome, fontWeight: "700" },
    hint: {
      color: colors.steel,
      fontSize: 12,
      textAlign: "center",
      marginTop: 16,
      lineHeight: 17,
    },
    resendButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.chrome,
      borderRadius: 13,
      paddingVertical: 14,
      paddingHorizontal: 24,
      marginTop: 26,
      width: "100%",
    },
    resendText: { color: colors.void, fontSize: 14.5, fontWeight: "700" },
    laterButton: { marginTop: 16, paddingVertical: 8 },
    laterText: { color: colors.steel, fontSize: 13.5, fontWeight: "600" },
    buttonPressed: { opacity: 0.7 },
    buttonDisabled: { opacity: 0.5 },
  });
