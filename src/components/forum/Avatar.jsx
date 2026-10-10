import { useTheme } from "@/contexts/ThemeContext";
import { absoluteUrl } from "@/services/forum";
import { Image } from "expo-image";
import { VenetianMask } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

// Stable per-name hue so letter avatars are distinguishable at a glance.
const HUES = ["#8E8EFF", "#FF9F0A", "#32D74B", "#64D2FF", "#FF6482", "#BF5AF2", "#FFD60A", "#5E9EFF"];
const hueFor = (name = "") => HUES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];

/** User or community avatar. `anonymous` renders a mask; no url → letter tile. */
export default function Avatar({ name, url, size = 28, anonymous = false, square = false }) {
  const { colors } = useTheme();
  const radius = square ? size * 0.28 : size / 2;
  const box = { width: size, height: size, borderRadius: radius };

  if (anonymous) {
    return (
      <View style={[styles.center, box, { backgroundColor: colors.glassFillRaised }]}>
        <VenetianMask size={size * 0.58} color={colors.steel} strokeWidth={1.8} />
      </View>
    );
  }
  if (url) {
    return <Image source={{ uri: absoluteUrl(url) }} style={[box, { backgroundColor: colors.onyx }]} contentFit="cover" transition={150} />;
  }
  const letter = (name || "?").replace(/^[cu]\//, "").charAt(0).toUpperCase();
  return (
    <View style={[styles.center, box, { backgroundColor: hueFor(name) }]}>
      <Text style={[styles.letter, { fontSize: size * 0.45 }]}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
  letter: { color: "#0A0A0B", fontWeight: "800" },
});
