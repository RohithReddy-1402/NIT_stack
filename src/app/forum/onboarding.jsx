import ForumTopBar from "@/components/forum/ForumTopBar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { setForumProfile, useForumProfile } from "@/hooks/forum/useForumProfile";
import { checkHandle, claimHandle } from "@/services/forum";
import { router } from "expo-router";
import { Check, CircleAlert, VenetianMask } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HANDLE_RE = /^[A-Za-z0-9_]{3,20}$/;

const GUIDELINES = [
  "Be kind. No harassment, bullying, threats or hate — including towards faculty and staff.",
  "Never share anyone's personal information: phone numbers, addresses, photos or roll numbers.",
  "Anonymous doesn't mean untraceable. Site admins can identify authors of serious abuse.",
  "No cheating material, leaked papers during exams, or academic dishonesty.",
  "No spam, scams or self-promotion outside the communities that allow it.",
  "Report content that breaks these rules. Moderators may remove it and ban accounts.",
];

export default function ForumOnboarding() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { token, isLoggedIn, loading: authLoading } = useAuth();
  const { status } = useForumProfile();
  const { addToast } = useToast();

  const [handle, setHandle] = useState("");
  const [check, setCheck] = useState({ state: "idle" }); // idle | checking | ok | bad
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.replace("/login");
  }, [authLoading, isLoggedIn]);

  // Already onboarded (e.g. opened from a stale link) → straight to the forum.
  // Skipped while saving: `submit` navigates back to where the user came from.
  useEffect(() => {
    if (status === "ready" && !saving) router.replace("/forum");
  }, [status, saving]);

  // Debounced availability check; aborted when the user keeps typing.
  const trimmed = handle.trim();
  const valid = HANDLE_RE.test(trimmed);
  useEffect(() => {
    if (!trimmed || !valid || !token) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setCheck({ state: "checking" });
      checkHandle(token, trimmed, controller.signal)
        .then((r) => setCheck(r.available ? { state: "ok" } : { state: "bad", reason: r.reason }))
        .catch((error) => {
          if (error?.name !== "AbortError") setCheck({ state: "idle" });
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, valid, token]);

  const localError =
    trimmed && !valid ? "3-20 characters: letters, numbers and _ only" : check.state === "bad" ? check.reason : null;
  const canSubmit = valid && check.state === "ok" && accepted && !saving;

  const submit = async () => {
    setSaving(true);
    try {
      const { profile } = await claimHandle(token, trimmed);
      setForumProfile(profile);
      addToast(`Welcome, u/${profile.handle}!`, "success");
      if (router.canGoBack()) router.back();
      else router.replace("/forum");
    } catch (error) {
      addToast(error?.message || "Couldn't save your username", "error");
      setSaving(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ForumTopBar title="Join the forum" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.h1}>Pick your username</Text>
          <Text style={styles.sub}>
            This is how classmates see you on the forum — it isn’t your real name. It’s permanent, so choose one you like.
          </Text>

          <View style={[styles.inputWrap, localError && styles.inputError]}>
            <Text style={styles.prefix}>u/</Text>
            <TextInput
              style={styles.input}
              value={handle}
              onChangeText={(v) => {
                setHandle(v.replace(/\s/g, ""));
                setCheck({ state: "idle" });
              }}
              placeholder="quiet_panda"
              placeholderTextColor={colors.steel}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              autoFocus
            />
            {check.state === "checking" ? <ActivityIndicator size="small" color={colors.steel} /> : null}
            {check.state === "ok" ? <Check size={18} color={colors.success} /> : null}
          </View>
          {localError ? (
            <View style={styles.errRow}>
              <CircleAlert size={14} color={colors.danger} />
              <Text style={styles.err}>{localError}</Text>
            </View>
          ) : null}

          <View style={styles.anonCard}>
            <VenetianMask size={22} color={colors.accent} />
            <Text style={styles.anonText}>
              Want to ask something sensitive? Turn on <Text style={styles.bold}>Post anonymously</Text> on any post or comment —
              your username is hidden from everyone, including community moderators.
            </Text>
          </View>

          <Text style={styles.section}>COMMUNITY GUIDELINES</Text>
          {GUIDELINES.map((g, i) => (
            <View key={i} style={styles.ruleRow}>
              <Text style={styles.ruleNum}>{i + 1}</Text>
              <Text style={styles.ruleText}>{g}</Text>
            </View>
          ))}

          <TouchableOpacity style={styles.acceptRow} onPress={() => setAccepted((a) => !a)} accessibilityRole="checkbox" accessibilityState={{ checked: accepted }}>
            <View style={[styles.box, accepted && styles.boxOn]}>{accepted ? <Check size={14} color={colors.void} strokeWidth={3} /> : null}</View>
            <Text style={styles.acceptText}>I agree to follow the community guidelines</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.cta, !canSubmit && styles.ctaDisabled]} disabled={!canSubmit} onPress={submit}>
            {saving ? <ActivityIndicator color={colors.void} /> : <Text style={styles.ctaText}>Join the forum</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    content: { padding: 20, paddingBottom: 140 },
    h1: { color: colors.chrome, fontSize: 24, fontWeight: "800" },
    sub: { color: colors.steel, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 18 },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      height: 52,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
      paddingHorizontal: 14,
    },
    inputError: { borderColor: colors.danger },
    prefix: { color: colors.steel, fontSize: 16, fontWeight: "600" },
    input: { flex: 1, color: colors.chrome, fontSize: 16, fontWeight: "600" },
    errRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
    err: { color: colors.danger, fontSize: 13 },
    anonCard: {
      flexDirection: "row",
      gap: 12,
      marginTop: 20,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.onyxRaised,
    },
    anonText: { flex: 1, color: colors.silver, fontSize: 13.5, lineHeight: 19 },
    bold: { fontWeight: "700", color: colors.chrome },
    section: { color: colors.steel, fontSize: 12, fontWeight: "700", letterSpacing: 0.6, marginTop: 26, marginBottom: 10 },
    ruleRow: { flexDirection: "row", gap: 12, marginBottom: 10 },
    ruleNum: { color: colors.steel, fontSize: 13, fontWeight: "700", width: 16 },
    ruleText: { flex: 1, color: colors.silver, fontSize: 13.5, lineHeight: 19 },
    acceptRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },
    box: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.steel,
      alignItems: "center",
      justifyContent: "center",
    },
    boxOn: { backgroundColor: colors.chrome, borderColor: colors.chrome },
    acceptText: { color: colors.chrome, fontSize: 14, flex: 1 },
    cta: {
      marginTop: 22,
      height: 52,
      borderRadius: 16,
      backgroundColor: colors.chrome,
      alignItems: "center",
      justifyContent: "center",
    },
    ctaDisabled: { opacity: 0.35 },
    ctaText: { color: colors.void, fontSize: 16, fontWeight: "700" },
  });
