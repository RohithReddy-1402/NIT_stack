import { useTheme } from "@/contexts/ThemeContext";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { Briefcase, GraduationCap, Library } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

// Extensible — add more destinations here as the app grows; anglesFor()
// below spaces however many items exist evenly across the semicircle.
const ITEMS = [
  { key: "syllabus", label: "Syllabus", icon: GraduationCap, route: "/syllabus" },
  { key: "opportunities", label: "Internships", icon: Briefcase, route: "/opportunities" },
  { key: "papers", label: "Papers", icon: Library, route: "/papers" },
];

const RADIUS = 120;
const BUBBLE = 58;
const ITEM_W = 92;
const ANGLE_PADDING = 25; // keeps the outermost items clear of the horizontal, so they read as "arcing up" rather than poking sideways
const OPEN_MS = 420;
const CLOSE_MS = 300;

/** Evenly spaces `count` items across [ANGLE_PADDING, 180 - ANGLE_PADDING], left to right matching ITEMS' own order. */
function anglesFor(count) {
  if (count <= 1) return [90];
  const span = 180 - ANGLE_PADDING * 2;
  return Array.from({ length: count }, (_, i) => 180 - ANGLE_PADDING - (span / (count - 1)) * i);
}

/**
 * Radial fan menu opened by the tab bar's middle hub button. A single
 * `progress` value (0→1) drives every item's angle as `targetAngle * progress`
 * — so opening sweeps each item from 0° out to its resting angle, and closing
 * sweeps back from its angle to 0°, exactly like a fan unfurling/folding.
 */
export default function HubSheet({ visible, onClose }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [modalVisible, setModalVisible] = useState(visible);
  const progress = useSharedValue(visible ? 1 : 0);

  // Standard "delay unmount for the exit animation" pattern: opening shows
  // the Modal right away; closing starts the reverse sweep immediately but
  // only unmounts once it's finished, via a plain setTimeout that effect
  // cleanup cancels if `visible` flips back to true first. Deliberately a
  // plain setTimeout rather than a withTiming completion callback + runOnJS —
  // an earlier version routed the unmount through a worklet callback guarded
  // by a shared value, which had a cross-thread desync bug that left the
  // Modal's full-screen backdrop mounted-but-invisible, silently eating every
  // touch on screen. setState directly in this effect is intentional (it's
  // synchronizing with the animation timing, which is what effects are for).
  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setModalVisible(true);
      progress.value = withTiming(1, { duration: OPEN_MS, easing: Easing.out(Easing.cubic) });
      return undefined;
    }
    progress.value = withTiming(0, { duration: CLOSE_MS, easing: Easing.in(Easing.cubic) });
    const timer = setTimeout(() => setModalVisible(false), CLOSE_MS);
    return () => clearTimeout(timer);
    // Only the visible prop should retrigger this — progress is a stable ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  if (!modalVisible) return null;

  const angles = anglesFor(ITEMS.length);
  const pivotX = width / 2;

  const open = (route) => {
    onClose();
    router.push(route);
  };

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        {/* Tapping anywhere except a bubble closes the menu — the bubbles sit
            in their own siblings above this, so this Pressable only ever
            catches the empty space around them. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.scrim} />
        </Pressable>
      </Animated.View>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {ITEMS.map((item, i) => (
          <FanItem key={item.key} item={item} progress={progress} angleDeg={angles[i]} pivotX={pivotX} colors={colors} onPress={() => open(item.route)} />
        ))}
      </View>
    </Modal>
  );
}

function FanItem({ item, progress, angleDeg, pivotX, colors, onPress }) {
  const styles = useMemo(() => getStyles(colors), [colors]);
  const Icon = item.icon;

  const animatedStyle = useAnimatedStyle(() => {
    const angle = angleDeg * progress.value; // 0 → angleDeg opening, angleDeg → 0 closing
    const rad = (angle * Math.PI) / 180;
    const radius = RADIUS * progress.value;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;
    return {
      opacity: progress.value,
      transform: [{ translateX: x - ITEM_W / 2 }, { translateY: -y }, { scale: 0.5 + progress.value * 0.5 }],
    };
  });

  return (
    <Animated.View style={[styles.fanItem, { left: pivotX }, animatedStyle]} pointerEvents="box-none">
      <TouchableOpacity style={styles.bubble} activeOpacity={0.8} onPress={onPress} accessibilityLabel={item.label}>
        <Icon size={24} color={colors.chrome} strokeWidth={1.9} />
      </TouchableOpacity>
      <Text style={styles.bubbleLabel} numberOfLines={1}>{item.label}</Text>
    </Animated.View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.25)" },
    fanItem: {
      position: "absolute",
      bottom: 40,
      width: ITEM_W,
      alignItems: "center",
    },
    bubble: {
      width: BUBBLE,
      height: BUBBLE,
      borderRadius: BUBBLE / 2,
      backgroundColor: colors.onyxRaised,
      borderWidth: 1,
      borderColor: colors.hairline,
      alignItems: "center",
      justifyContent: "center",
      elevation: 6,
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    bubbleLabel: {
      marginTop: 6,
      color: colors.chrome,
      fontSize: 11,
      fontWeight: "700",
      textAlign: "center",
    },
  });
