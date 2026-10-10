import PostEditor, {
  TenTapStartKit,
  darkEditorTheme,
  defaultEditorTheme,
  useEditorBridge,
} from "@/components/forum/PostEditor";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Full-screen editor for a post body or comment. `onSave(text)` throws on
 * failure. `richText` switches to the rich (HTML) post editor — only ever
 * true for a post whose `bodyFormat` is already "html"; comments and
 * plain-markdown posts keep the simple text box.
 */
export default function EditModal({ visible, title, initial = "", maxLength = 40000, allowEmpty = false, richText = false, onSave, onClose }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);

  const editor = useEditorBridge({
    bridgeExtensions: TenTapStartKit,
    initialContent: richText ? initial : "",
    dynamicHeight: true,
    theme: isDark ? darkEditorTheme : defaultEditorTheme,
  });

  useEffect(() => {
    if (visible && richText) editor.setContent(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const save = async () => {
    setSaving(true);
    try {
      const value = richText ? await editor.getHTML() : text.trim();
      await onSave(value);
      onClose();
    } catch {
      // Caller toasts; keep the modal open with the text.
    } finally {
      setSaving(false);
    }
  };

  const canSave = richText ? !saving : (allowEmpty || text.trim()) && text.trim() !== initial.trim() && !saving;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} onShow={() => setText(initial)}>
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <View style={styles.bar}>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={save} disabled={!canSave} hitSlop={10}>
              {saving ? <ActivityIndicator color={colors.chrome} /> : <Text style={[styles.save, !canSave && styles.off]}>Save</Text>}
            </TouchableOpacity>
          </View>
          {richText ? (
            <ScrollView contentContainerStyle={styles.richWrap} keyboardShouldPersistTaps="handled">
              <PostEditor editor={editor} />
            </ScrollView>
          ) : (
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              multiline
              autoFocus
              maxLength={maxLength}
              placeholderTextColor={colors.steel}
              textAlignVertical="top"
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    bar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    title: { color: colors.chrome, fontSize: 16, fontWeight: "700" },
    cancel: { color: colors.steel, fontSize: 15 },
    save: { color: colors.accent, fontSize: 15, fontWeight: "700" },
    off: { opacity: 0.35 },
    input: { flex: 1, color: colors.chrome, fontSize: 15.5, lineHeight: 22, padding: 16 },
    richWrap: { padding: 16 },
  });
