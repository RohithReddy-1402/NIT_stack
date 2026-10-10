import { useTheme } from "@/contexts/ThemeContext";
import { ShieldCheck } from "lucide-react-native";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

/** Shown only when an admin has actually verified the opportunity — never implied otherwise. */
export default function VerifiedBadge({ compact = false }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      <ShieldCheck size={compact ? 12 : 14} color={colors.success} strokeWidth={2.2} />
      {!compact ? <Text style={styles.text}>Verified</Text> : null}
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    wrap: { flexDirection: "row", alignItems: "center", gap: 3 },
    text: { color: colors.success, fontSize: 11.5, fontWeight: "700" },
  });
