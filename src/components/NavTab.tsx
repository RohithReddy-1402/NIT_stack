import { BlurView } from "expo-blur";
import React, { useEffect, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import Svg, { Circle, Path } from "react-native-svg";

const icons: Record<string, (color: string) => React.ReactNode> = {
  home: (color) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 11.5 12 4l9 7.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Path
        d="M5.5 9.8V20h13V9.8"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),

  explore: (color) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />

      <Path
        d="m15 9-2 6-6 2 2-6 6-2Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  ),

  saved: (color) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 3.5h9.5A1.5 1.5 0 0 1 17 5v16l-5.5-3.5L6 21V5A1.5 1.5 0 0 1 7.5 3.5Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  ),

  forum: (color) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 5.5A1.5 1.5 0 0 1 5.5 4h9A1.5 1.5 0 0 1 16 5.5v6a1.5 1.5 0 0 1-1.5 1.5H9l-3.5 3v-3h0A1.5 1.5 0 0 1 4 11.5v-6Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />

      <Path
        d="M19 9.5h.5A1.5 1.5 0 0 1 21 11v6a1.5 1.5 0 0 1-1.5 1.5H19v2.5L15.8 18.5H12a1.5 1.5 0 0 1-1.5-1.5v-1"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),

  profile: (color) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={3.5} stroke={color} strokeWidth={1.8} />

      <Path
        d="M5 20c1.2-4 4-6 7-6s5.8 2 7 6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  ),

  attendance: (color) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 4h9.5A1.5 1.5 0 0 1 17 5.5V20l-5.5-2.8L6 20V5.5A1.5 1.5 0 0 1 7.5 4Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />

      <Path
        d="m9 11 2 2 4-4.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),

  hub: (color) => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7h16M4 12h16M4 17h16"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  ),
};

export type TabItem = {
  key: string;
  label: string;
  icon: keyof typeof icons;
};

type Props = {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
};

const INK_HI = "rgba(255,255,255,0.96)";
const INK_LO = "rgba(255,255,255,0.12)";

export default function LiquidGlassTabBar({
  tabs,
  activeKey,
  onChange,
}: Props) {
  const layouts = useRef<Record<string, { x: number; width: number }>>({});

  const [ready, setReady] = useState(false);

  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);

  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);

  const measure = (key: string) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;

    layouts.current[key] = {
      x,
      width,
    };
    if (key === activeKey && !ready) {
      pillX.value = x;
      pillW.value = width;

      setReady(true);
    }
  };
  useEffect(() => {
    const layout = layouts.current[activeKey];

    if (!layout) return;

    pillX.value = withSpring(layout.x + 5, {
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    });

    pillW.value = withSpring(layout.width - 10, {
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    });

    scaleX.value = withSequence(
      withTiming(1.06, { duration: 100 }),
      withSpring(1, {
        damping: 9,
        stiffness: 220,
      }),
    );

    scaleY.value = withSequence(
      withTiming(0.94, { duration: 100 }),
      withSpring(1, {
        damping: 9,
        stiffness: 220,
      }),
    );
  }, [activeKey]);

  const moveTo = (key: string) => {
    const layout = layouts.current[key];

    if (!layout) return;

    pillX.value = withSpring(layout.x, {
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    });

    pillW.value = withSpring(layout.width, {
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    });

    // Small liquid-like deformation
    scaleX.value = withSequence(
      withTiming(1.06, {
        duration: 100,
      }),
      withSpring(1, {
        damping: 9,
        stiffness: 220,
      }),
    );

    scaleY.value = withSequence(
      withTiming(0.94, {
        duration: 100,
      }),
      withSpring(1, {
        damping: 9,
        stiffness: 220,
      }),
    );
  };

  const handlePress = (key: string) => {
    // Always notify the parent, even for the already-active tab — it needs
    // to hear about reselects to trigger a refresh. The pill-slide animation
    // below is driven by `activeKey` changing, so reselecting the same tab
    // naturally stays a no-op there.
    onChange(key);
  };

  const pillStyle = useAnimatedStyle(() => {
    return {
      left: pillX.value,
      width: pillW.value,

      transform: [
        {
          scaleX: scaleX.value,
        },
        {
          scaleY: scaleY.value,
        },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />

        <View pointerEvents="none" style={styles.glassBackground} />

        <View style={styles.tabbar}>
          <Animated.View
            pointerEvents="none"
            style={[styles.activePill, pillStyle]}
          >
            <BlurView
              intensity={1}
              tint="light"
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.activePillBackground} />
          </Animated.View>

          {tabs.map((tab) => {
            const active = tab.key === activeKey;

            return (
              <Pressable
                key={tab.key}
                onLayout={measure(tab.key)}
                onPress={() => handlePress(tab.key)}
                style={({ pressed }) => [
                  styles.tab,
                  pressed && styles.tabPressed,
                ]}
                hitSlop={6}
              >
                {icons[tab.icon](active ? INK_HI : INK_LO)}

                <Text
                  style={[styles.tabLabel, active && styles.tabLabelActive]}
                >
                  {tab.label}
                </Text>

                {active && <View style={styles.dot} />}
              </Pressable>
            );
          })}
        </View>

        <View pointerEvents="none" style={styles.cardBorder} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",

    left: 12,
    right: 12,

    bottom: 0,

    height: 72,

    zIndex: 100,
  },
  card: {
    flex: 1,

    borderRadius: 28,

    overflow: "hidden",

    backgroundColor: "rgba(1,1,1,0.1)",

    ...Platform.select({
      ios: {
        shadowColor: "#000",

        shadowOpacity: 0.35,

        shadowRadius: 25,

        shadowOffset: {
          width: 0,
          height: 12,
        },
      },

      android: {
        elevation: 12,
      },

      web: {
        boxShadow: "0px 8px 30px rgba(0,0,0,0.35)",
      },
    }),
  },

  glassBackground: {
    ...StyleSheet.absoluteFill,

    backgroundColor: "rgba(255,255,255,0.015)",
  },

  tabbar: {
    flex: 1,

    flexDirection: "row",

    position: "relative",

    marginHorizontal: 5,

    borderRadius: 27,

    overflow: "hidden",

    backgroundColor: "rgba(10,10,10,0.001)",
  },

  activePill: {
    position: "absolute",

    top: 5,
    bottom: 5,

    borderRadius: 24,

    overflow: "hidden",
    width: 8,

    backgroundColor: "rgba(255,255,255,0.015)",

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.1)",

    zIndex: 1,
  },

  activePillBackground: {
    ...StyleSheet.absoluteFill,

    backgroundColor: "rgba(255,255,255,0.025)",
  },

  tab: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    gap: 4,

    zIndex: 2,
  },

  tabPressed: {
    opacity: 0.65,
  },

  tabLabel: {
    fontSize: 11.5,

    fontWeight: "500",

    color: INK_LO,
  },

  tabLabelActive: {
    color: INK_HI,

    fontWeight: "600",
  },

  dot: {
    position: "absolute",

    bottom: 3,

    width: 4,

    height: 4,

    borderRadius: 2,

    backgroundColor: INK_HI,
  },

  cardBorder: {
    ...StyleSheet.absoluteFill,

    borderRadius: 28,

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.3)",
  },
});
