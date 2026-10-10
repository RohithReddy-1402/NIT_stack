import { useTheme } from "@/contexts/ThemeContext";
import { Check } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export const REPORT_REASONS = [
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate", label: "Hate speech" },
  { value: "personal_info", label: "Shares someone's personal info" },
  { value: "sexual", label: "Sexual content" },
  { value: "spam", label: "Spam or scam" },
  { value: "misinformation", label: "False information" },
  { value: "other", label: "Something else" },
];

/** Reason picker + optional details. `onSubmit(reason, details)` should throw on failure. */
export default function ReportSheet({ visible, what = "post", onSubmit, onClose }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [reason, setReason] = useState(null);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  const close = () => {
    setReason(null);
    setDetails("");
    setSending(false);
    onClose();
  };

  const submit = async () => {
    if (!reason) return;
    setSending(true);
    try {
      await onSubmit(reason, details.trim());
      close();
    } catch {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.title}>Report this {what}</Text>
            <Text style={styles.hint}>Moderators review reports. The author isn’t told who reported them.</Text>
            {REPORT_REASONS.map((r) => (
              <TouchableOpacity key={r.value} style={styles.row} onPress={() => setReason(r.value)}>
                <Text style={[styles.label, reason === r.value && styles.labelActive]}>{r.label}</Text>
                {reason === r.value ? <Check size={18} color={colors.accent} /> : null}
              </TouchableOpacity>
            ))}
            <TextInput
              style={styles.input}
              value={details}
              onChangeText={setDetails}
              placeholder="Anything moderators should know? (optional)"
              placeholderTextColor={colors.steel}
              maxLength={500}
              multiline
            />
            <TouchableOpacity
              style={[styles.submit, !reason && styles.submitDisabled]}
              disabled={!reason || sending}
              onPress={submit}
            >
              {sending ? <ActivityIndicator color={colors.void} /> : <Text style={styles.submitText}>Submit report</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    sheet: {
      backgroundColor: colors.onyxRaised,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 10,
      paddingHorizontal: 20,
      paddingBottom: 30,
    },
    handle: {
      width: 40, height: 4, borderRadius: 2, backgroundColor: colors.hairline, alignSelf: "center", marginBottom: 12,
    },
    title: { color: colors.chrome, fontSize: 17, fontWeight: "700" },
    hint: { color: colors.steel, fontSize: 12.5, marginTop: 4, marginBottom: 8 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    label: { color: colors.silver, fontSize: 15 },
    labelActive: { color: colors.chrome, fontWeight: "600" },
    input: {
      marginTop: 12,
      minHeight: 64,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
      color: colors.chrome,
      padding: 12,
      fontSize: 14,
      textAlignVertical: "top",
    },
    submit: {
      marginTop: 14,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.chrome,
      alignItems: "center",
      justifyContent: "center",
    },
    submitDisabled: { opacity: 0.35 },
    submitText: { color: colors.void, fontSize: 15, fontWeight: "700" },
  });
