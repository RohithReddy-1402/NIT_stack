import { router } from "expo-router";
import { FileQuestion } from "lucide-react-native";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.screen}>
      <FileQuestion size={48} color={colors.steel} strokeWidth={1.5} />
      <Text style={styles.title}>404</Text>
      <Text style={styles.subtitle}>
        We couldn&apos;t find the page you were looking for.
      </Text>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={() => router.replace("/")}
      >
        <Text style={styles.buttonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.void,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    color: colors.chrome,
    fontSize: 56,
    fontWeight: "800",
    marginTop: 16,
  },
  subtitle: {
    color: colors.silver,
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 28,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.chrome,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  buttonText: { color: colors.void, fontSize: 14.5, fontWeight: "700" },
});
