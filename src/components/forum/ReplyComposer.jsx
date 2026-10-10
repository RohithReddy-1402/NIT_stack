import { useTheme } from "@/contexts/ThemeContext";
import { Send, VenetianMask, X } from "lucide-react-native";
import { forwardRef, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

/**
 * Sticky comment box. `replyTo` = { id, label } when replying to a comment.
 * `onSubmit(text, isAnonymous)` should throw on failure (the text is kept).
 * `onFocusAttempt()` returning false blocks typing (not logged in / no handle).
 */
const ReplyComposer = forwardRef(function ReplyComposer(
  { replyTo, onCancelReply, onSubmit, onFocusAttempt, disabledReason },
  ref,
) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [text, setText] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [sending, setSending] = useState(false);

  if (disabledReason) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.disabled}>{disabledReason}</Text>
      </View>
    );
  }

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await onSubmit(body, anonymous);
      setText("");
    } catch {
      // Caller shows the error; keep the draft.
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {replyTo ? (
        <View style={styles.replyingRow}>
          <Text style={styles.replying} numberOfLines={1}>Replying to {replyTo.label}</Text>
          <TouchableOpacity onPress={onCancelReply} hitSlop={10} accessibilityLabel="Cancel reply">
            <X size={16} color={colors.steel} />
          </TouchableOpacity>
        </View>
      ) : null}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.anonBtn, anonymous && styles.anonBtnOn]}
          onPress={() => setAnonymous((a) => !a)}
          accessibilityRole="switch"
          accessibilityState={{ checked: anonymous }}
          accessibilityLabel="Comment anonymously"
        >
          <VenetianMask size={18} color={anonymous ? colors.void : colors.steel} />
        </TouchableOpacity>
        <TextInput
          ref={ref}
          style={styles.input}
          value={text}
          onChangeText={setText}
          onFocus={() => {
            if (onFocusAttempt && onFocusAttempt() === false) ref?.current?.blur();
          }}
          placeholder={anonymous ? "Comment anonymously…" : "Add a comment…"}
          placeholderTextColor={colors.steel}
          multiline
          maxLength={10000}
        />
        <TouchableOpacity style={[styles.send, !text.trim() && styles.sendOff]} onPress={send} disabled={!text.trim() || sending} accessibilityLabel="Send">
          {sending ? <ActivityIndicator size="small" color={colors.void} /> : <Send size={17} color={colors.void} />}
        </TouchableOpacity>
      </View>
      {anonymous ? <Text style={styles.anonHint}>Your username is hidden on this comment.</Text> : null}
    </View>
  );
});

export default ReplyComposer;

const getStyles = (colors) =>
  StyleSheet.create({
    // Sits above the floating tab bar (72px + gap).
    wrap: {
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
      backgroundColor: colors.onyx,
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 8,
      marginBottom: 80,
    },
    replyingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
    replying: { color: colors.steel, fontSize: 12.5, flex: 1 },
    row: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
    anonBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: colors.hairline,
      alignItems: "center",
      justifyContent: "center",
    },
    anonBtnOn: { backgroundColor: colors.chrome, borderColor: colors.chrome },
    input: {
      flex: 1,
      minHeight: 38,
      maxHeight: 120,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
      color: colors.chrome,
      paddingHorizontal: 14,
      paddingTop: 9,
      paddingBottom: 9,
      fontSize: 14.5,
    },
    send: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.chrome,
      alignItems: "center",
      justifyContent: "center",
    },
    sendOff: { opacity: 0.35 },
    anonHint: { color: colors.accent, fontSize: 11.5, marginTop: 5, marginLeft: 46 },
    disabled: { color: colors.steel, fontSize: 13, textAlign: "center", paddingVertical: 10 },
  });
