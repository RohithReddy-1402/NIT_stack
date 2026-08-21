import { X } from "lucide-react-native";
import { useEffect, useRef } from "react";
import {
    Animated,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const colors = {
  onyx: "#141416",
  onyxRaised: "#1C1C1F",
  chrome: "#F5F5F7",
  silver: "#C9C9CE",
  steel: "#8E8E93",
  hairline: "#2C2C30",
};

const ACCENTS = {
  info: colors.chrome, // white/chrome — neutral, default
  success: "#32D74B", // green
  error: "#FF453A", // red
  warning: "#FFD60A", // amber, in case you use it elsewhere
};

const ToastContainer = ({ toasts, onClose }) => {
  if (!toasts.length) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
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

      {/* countdown line: 100% -> 0% */}
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

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 32,
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
    paddingTop: 12,
    paddingHorizontal: 14,
    paddingBottom: 10,
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
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  message: {
    flex: 1,
    color: colors.chrome,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
  },
  closeBtn: {
    marginLeft: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  trackBg: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.hairline,
    marginTop: 10,
    overflow: "hidden",
  },
  trackFill: {
    height: "100%",
    borderRadius: 2,
  },
});

export default ToastContainer;
