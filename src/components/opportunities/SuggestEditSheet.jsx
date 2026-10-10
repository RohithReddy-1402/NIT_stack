import { useTheme } from "@/contexts/ThemeContext";
import { useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

/** Free-text correction request on an already-published opportunity — an admin reviews the note and applies the fix themselves (no auto-merge). `onSubmit(note)` should throw on failure. */
export default function SuggestEditSheet({ visible, onSubmit, onClose }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const close = () => {
    setNote("");
    setSending(false);
    onClose();
  };

  const submit = async () => {
    if (!note.trim()) return;
    setSending(true);
    try {
      await onSubmit(note.trim());
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
            <Text style={styles.title}>Suggest an edit</Text>
            <Text style={styles.hint}>
              Spot something outdated or wrong — a passed deadline, a broken link, a wrong stipend? Let an admin know and they'll fix it.
            </Text>
            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              placeholder="What should change?"
              placeholderTextColor={colors.steel}
              maxLength={500}
              multiline
              autoFocus
            />
            <TouchableOpacity style={[styles.submit, !note.trim() && styles.submitDisabled]} disabled={!note.trim() || sending} onPress={submit}>
              {sending ? <ActivityIndicator color={colors.void} /> : <Text style={styles.submitText}>Send suggestion</Text>}
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
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.hairline, alignSelf: "center", marginBottom: 12 },
    title: { color: colors.chrome, fontSize: 17, fontWeight: "700" },
    hint: { color: colors.steel, fontSize: 12.5, marginTop: 4, marginBottom: 10, lineHeight: 17 },
    input: {
      minHeight: 90,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
      color: colors.chrome,
      padding: 12,
      fontSize: 14,
      textAlignVertical: "top",
    },
    submit: { marginTop: 14, height: 48, borderRadius: 14, backgroundColor: colors.chrome, alignItems: "center", justifyContent: "center" },
    submitDisabled: { opacity: 0.35 },
    submitText: { color: colors.void, fontSize: 15, fontWeight: "700" },
  });
