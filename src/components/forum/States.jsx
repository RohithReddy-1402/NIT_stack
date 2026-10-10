import Skeleton from "@/components/Skeleton";
import { useTheme } from "@/contexts/ThemeContext";
import { WifiOff } from "lucide-react-native";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

/** Centered icon + title + subtitle + optional action — for empty and error states. */
export function EmptyState({ icon: Icon = WifiOff, title, subtitle, actionLabel, onAction }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  return (
    <View style={styles.empty}>
      <Icon size={40} color={colors.steel} strokeWidth={1.5} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
      {actionLabel ? (
        <TouchableOpacity style={styles.emptyBtn} onPress={onAction}>
          <Text style={styles.emptyBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/** Placeholder shaped like a PostCard. */
export function PostSkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton style={{ width: 22, height: 22, borderRadius: 11 }} />
        <Skeleton style={{ width: "40%", height: 10 }} />
      </View>
      <Skeleton style={{ width: "85%", height: 15, marginTop: 12 }} />
      <Skeleton style={{ width: "60%", height: 15, marginTop: 8 }} />
      <Skeleton style={{ width: "95%", height: 10, marginTop: 12 }} />
      <View style={[styles.row, { marginTop: 14 }]}>
        <Skeleton style={{ width: 86, height: 30, borderRadius: 15 }} />
        <Skeleton style={{ width: 60, height: 30, borderRadius: 15 }} />
      </View>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    empty: { alignItems: "center", paddingHorizontal: 32, paddingVertical: 56, gap: 10 },
    emptyTitle: { color: colors.chrome, fontSize: 17, fontWeight: "700", textAlign: "center" },
    emptySub: { color: colors.steel, fontSize: 13.5, textAlign: "center", lineHeight: 19 },
    emptyBtn: {
      marginTop: 8,
      paddingHorizontal: 22,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.chrome,
      justifyContent: "center",
    },
    emptyBtnText: { color: colors.void, fontWeight: "700", fontSize: 14 },
    card: {
      backgroundColor: colors.onyxRaised,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: 14,
      marginBottom: 10,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
  });
