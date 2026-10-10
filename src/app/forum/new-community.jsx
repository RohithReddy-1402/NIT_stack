import ForumTopBar from "@/components/forum/ForumTopBar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useForumGate, useForumProfile } from "@/hooks/forum/useForumProfile";
import { createCommunity } from "@/services/forum";
import { router } from "expo-router";
import { Plus, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NAME_RE = /^[A-Za-z0-9_]{3,21}$/;

export default function NewCommunity() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { token, isLoggedIn, loading: authLoading } = useAuth();
  const { status } = useForumProfile();
  const { handleError } = useForumGate();
  const { addToast } = useToast();

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState([]);
  const [restricted, setRestricted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.replace("/login");
    else if (status === "none") router.replace("/forum/onboarding");
  }, [authLoading, isLoggedIn, status]);

  const nameError = name && !NAME_RE.test(name) ? "3-21 characters: letters, numbers and _" : null;
  const canSave = NAME_RE.test(name) && rules.every((r) => r.title.trim()) && !saving;

  const submit = async () => {
    setSaving(true);
    try {
      const community = await createCommunity(token, {
        name,
        title: title.trim() || name,
        description: description.trim(),
        rules: rules.map((r) => ({ title: r.title.trim(), body: r.body.trim() })),
        type: restricted ? "restricted" : "public",
      });
      addToast(`c/${community.name} is live!`, "success");
      router.replace(`/forum/c/${community.name}`);
    } catch (error) {
      handleError(error, "Couldn't create the community");
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ForumTopBar
        title="New community"
        right={
          <TouchableOpacity style={[styles.btn, !canSave && styles.off]} disabled={!canSave} onPress={submit}>
            {saving ? <ActivityIndicator size="small" color={colors.void} /> : <Text style={styles.btnText}>Create</Text>}
          </TouchableOpacity>
        }
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Name</Text>
          <View style={[styles.nameWrap, nameError && { borderColor: colors.danger }]}>
            <Text style={styles.prefix}>c/</Text>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={(v) => setName(v.replace(/\s/g, "_"))}
              placeholder="cse_2027"
              placeholderTextColor={colors.steel}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={21}
            />
          </View>
          <Text style={[styles.help, nameError && { color: colors.danger }]}>
            {nameError || "Permanent — it's in every link. You can create one community a day and own up to five."}
          </Text>

          <Text style={styles.label}>Display title</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="CSE Batch of 2027" placeholderTextColor={colors.steel} maxLength={100} />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { minHeight: 90 }]}
            value={description}
            onChangeText={setDescription}
            placeholder="What's this community about?"
            placeholderTextColor={colors.steel}
            maxLength={500}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.rulesHead}>
            <Text style={styles.label}>Rules</Text>
            {rules.length < 15 ? (
              <TouchableOpacity style={styles.addRule} onPress={() => setRules((r) => [...r, { title: "", body: "" }])}>
                <Plus size={15} color={colors.accent} />
                <Text style={styles.addRuleText}>Add rule</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {rules.map((rule, i) => (
            <View key={i} style={styles.ruleCard}>
              <View style={styles.ruleTop}>
                <TextInput
                  style={styles.ruleTitle}
                  value={rule.title}
                  onChangeText={(v) => setRules((r) => r.map((x, j) => (j === i ? { ...x, title: v } : x)))}
                  placeholder={`Rule ${i + 1}`}
                  placeholderTextColor={colors.steel}
                  maxLength={100}
                />
                <TouchableOpacity onPress={() => setRules((r) => r.filter((_, j) => j !== i))} hitSlop={8} accessibilityLabel="Remove rule">
                  <X size={16} color={colors.steel} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.ruleBody}
                value={rule.body}
                onChangeText={(v) => setRules((r) => r.map((x, j) => (j === i ? { ...x, body: v } : x)))}
                placeholder="Details (optional)"
                placeholderTextColor={colors.steel}
                maxLength={500}
                multiline
              />
            </View>
          ))}

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Only moderators can post</Text>
              <Text style={styles.help}>Good for announcements. Everyone can still comment.</Text>
            </View>
            <Switch value={restricted} onValueChange={setRestricted} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    content: { padding: 16, paddingBottom: 160, gap: 8 },
    btn: { height: 34, paddingHorizontal: 16, borderRadius: 17, backgroundColor: colors.chrome, alignItems: "center", justifyContent: "center" },
    btnText: { color: colors.void, fontWeight: "700" },
    off: { opacity: 0.35 },
    label: { color: colors.chrome, fontSize: 14, fontWeight: "700", marginTop: 10 },
    nameWrap: {
      flexDirection: "row",
      alignItems: "center",
      height: 50,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
      paddingHorizontal: 14,
    },
    prefix: { color: colors.steel, fontSize: 16, fontWeight: "600" },
    nameInput: { flex: 1, color: colors.chrome, fontSize: 16, fontWeight: "600" },
    help: { color: colors.steel, fontSize: 12, lineHeight: 17 },
    input: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
      color: colors.chrome,
      padding: 14,
      fontSize: 15,
    },
    rulesHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    addRule: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 10 },
    addRuleText: { color: colors.accent, fontWeight: "700", fontSize: 13 },
    ruleCard: { borderRadius: 14, borderWidth: 1, borderColor: colors.hairline, padding: 12, gap: 6 },
    ruleTop: { flexDirection: "row", alignItems: "center", gap: 8 },
    ruleTitle: { flex: 1, color: colors.chrome, fontSize: 15, fontWeight: "600" },
    ruleBody: { color: colors.silver, fontSize: 14 },
    switchRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16 },
    switchTitle: { color: colors.chrome, fontSize: 14.5, fontWeight: "600" },
  });
