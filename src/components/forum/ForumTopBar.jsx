import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

/** Back button + title (+ optional subtitle) + right-side slot, matching the app's other screens. */
export default function ForumTopBar({ title, subtitle, right, onBack }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const goBack = () => {
    if (onBack) return onBack();
    // Deep links open straight onto a post, so there may be nothing to go back to.
    if (router.canGoBack()) router.back();
    else router.replace("/forum");
  };

  return (
    <View style={styles.topBar}>
      <TouchableOpacity onPress={goBack} style={styles.side} accessibilityLabel="Back">
        <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
      gap: 6,
    },
    side: { minWidth: 36, height: 36, alignItems: "center", justifyContent: "center" },
    right: { flexDirection: "row", gap: 4 },
    title: { color: colors.chrome, fontSize: 17, fontWeight: "700" },
    subtitle: { color: colors.steel, fontSize: 12, marginTop: 1 },
  });
