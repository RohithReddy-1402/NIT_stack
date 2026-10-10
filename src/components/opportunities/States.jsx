import Skeleton from "@/components/Skeleton";
import { useTheme } from "@/contexts/ThemeContext";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

// EmptyState is reused directly from @/components/forum/States — it's
// already generic. Only the card-shaped skeleton needs its own version here.

/** Placeholder shaped like an OpportunityCard. */
export function OpportunitySkeleton() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton style={{ width: 40, height: 40, borderRadius: 10 }} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton style={{ width: "55%", height: 10 }} />
          <Skeleton style={{ width: "30%", height: 10 }} />
        </View>
      </View>
      <Skeleton style={{ width: "85%", height: 15, marginTop: 12 }} />
      <Skeleton style={{ width: "60%", height: 12, marginTop: 10 }} />
      <View style={[styles.row, { marginTop: 14 }]}>
        <Skeleton style={{ width: 90, height: 24, borderRadius: 8 }} />
        <Skeleton style={{ width: 60, height: 24, borderRadius: 8 }} />
      </View>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.onyxRaised,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: 14,
      marginBottom: 10,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 10 },
  });
