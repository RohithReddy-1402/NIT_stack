import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useState } from "react";
import { Animated, StyleSheet } from "react-native";

export default function Skeleton({ style }) {
  const { colors } = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.35));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  // `hairline` keeps the placeholder visible in both themes.
  return <Animated.View style={[styles.base, { backgroundColor: colors.hairline }, style, { opacity }]} />;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
  },
});
