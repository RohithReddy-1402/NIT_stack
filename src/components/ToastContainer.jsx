import { X } from "lucide-react-native";
import { useEffect, useMemo, useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";

const ToastContainer = ({ toasts, onClose }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  if (!toasts.length) return null;

  return (
    <View
      style={[styles.container, { top: insets.top + 8 }]}
      pointerEvents="box-none"
    >
      {toasts.map(({ id, message, type, duration }) => (
        <Toast
          key={id}
          id={id}
          message={message}
          type={type}
          duration={duration}
          onClose={onClose}
        />
      ))}
    </View>
  );
};

const Toast = ({ id, message, type, duration = 3500, onClose }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const ACCENTS = useMemo(
    () => ({
      info: colors.chrome, // white/chrome — neutral, default
      success: "#32D74B", // green
      error: "#FF453A", // red
      warning: "#FFD60A", // amber, in case you use it elsewhere
    }),
    [colors],
  );
  const progress = useRef(new Animated.Value(1)).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();

    Animated.timing(progress, {
      toValue: 0,
      duration,
      useNativeDriver: false,
    }).start();
  }, []);

  const accent = ACCENTS[type] || ACCENTS.info;

  const widthPct = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity: enter,
          transform: [
            {
              translateY: enter.interpolate({
                inputRange: [0, 1],
                outputRange: [-16, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>
        <TouchableOpacity
          onPress={() => onClose(id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.closeBtn}
        >
          <X size={16} color={colors.steel} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* countdown line: 100% -> 0%, pinned flush to the bottom edge */}
      <View style={styles.trackBg}>
        <Animated.View
          style={[
            styles.trackFill,
            { width: widthPct, backgroundColor: accent },
          ]}
        />
      </View>
    </Animated.View>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 999,
    gap: 10,
  },
  toast: {
    backgroundColor: colors.onyxRaised,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    // Taller than before, with the bottom padding a touch larger than the top
    // because the 4px countdown line overlays the bottom edge.
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginRight: 12,
  },
  message: {
    flex: 1,
    color: colors.chrome,
    fontSize: 14.5,
    fontWeight: "600",
    lineHeight: 20,
  },
  closeBtn: {
    marginLeft: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  // Absolutely positioned so it sits on the bottom edge rather than after the
  // content; the toast's rounded corners (overflow: hidden) clip its ends.
  trackBg: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    backgroundColor: colors.hairline,
  },
  trackFill: {
    height: "100%",
  },
});

export default ToastContainer;
