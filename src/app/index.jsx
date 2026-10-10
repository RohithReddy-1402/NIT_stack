import { useToast } from "@/contexts/ToastContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ArrowRight,
  Book,
  BookOpen,
  CalendarCheck,
  Download,
  Star,
  Upload,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useAttendanceSemesters } from "../hooks/useAttendanceSemesters";
import { useAttendanceStats } from "../hooks/useAttendanceStats";
import { useRefetchOnFocus } from "../hooks/useRefetchOnFocus";
import { usePapers } from "../hooks/usePapers";
import { onTabReselect } from "../utils/tabRefresh";
const { width: SCREEN_W } = Dimensions.get("window");

const HomePage = () => {
  const { addToast } = useToast();
  const { isLoggedIn, user } = useAuth();
  const { questionPapers, refetch: refetchPapers } = usePapers();
  // Home only shows attendance numbers, so it must not create the implicit
  // semester just by being opened — that happens on the Attendance screen.
  const { activeSemester, refetch: refetchSemesters } =
    useAttendanceSemesters({ create: false });
  const { stats: attendanceStats, refetch: refetchAttendanceStats } =
    useAttendanceStats(activeSemester?.id);
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [showWelcome, setShowWelcome] = useState(true);
  const [pressedKey, setPressedKey] = useState(null);
  useEffect(() => {
    (async () => {
      const shown = await AsyncStorage.getItem("welcomeShown");
      setShowWelcome(!shown);
    })();
  }, []);

  useEffect(() => {
    if (showWelcome) {
      const timer = setTimeout(async () => {
        setShowWelcome(false);
        await AsyncStorage.setItem("welcomeShown", "true");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  // Attendance is edited on screens pushed over Home, so reload its numbers
  // (and whether a semester exists yet) when coming back.
  useRefetchOnFocus(() => {
    refetchSemesters();
    refetchAttendanceStats();
  });

  // Re-tapping the Home tab while already on Home has nowhere to navigate
  // to, so treat it as a pull-to-refresh instead.
  useEffect(() => onTabReselect((key) => {
    if (key !== "/") return;
    refetchPapers();
    refetchAttendanceStats();
  }), [refetchPapers, refetchAttendanceStats]);

  const handleQuestionPapers = () => {
    router.push("papers");
  };

  const handleAdminDashboard = () => {
    router.push("admin");
  };

  const handleContribute = () => {
    if (!isLoggedIn) {
      addToast("Please log in to Contribute", "error");
    } else {
      router.push("contribute");
    }
  };

  const handleSyllabus = () => {
    router.push("syllabus");
  };

  const handleAttendance = () => {
    if (!isLoggedIn) {
      addToast("Please log in to track attendance", "error");
    } else {
      router.push("attendance");
    }
  };

  const papersLength = questionPapers?.length ?? 0;
  const downloadCount = (questionPapers ?? []).reduce(
    (sum, paper) => sum + (paper.downloads ?? 0),
    0,
  );

  if (showWelcome) {
    return (
      <View style={styles.splash}>
        <LinearGradient
          colors={[colors.void, "#000000"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.splashRow}>
          <Text style={styles.splashText}>NexSphere</Text>
          <Book size={34} color={colors.chrome} strokeWidth={1.75} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[colors.void, "#000000"]}
        style={StyleSheet.absoluteFill}
      />

      <Header />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroTextBlock}>
          <Text style={styles.eyebrow}>NIT KURUKSHETRA · ARCHIVE</Text>
          <Text style={styles.heading}>Previous Year{"\n"}Question Papers</Text>
          <Text style={styles.subheading}>
            Access previous question papers and contribute to help fellow
            students excel in their academic journey.
          </Text>
        </View>

        {/* Signature element: glossy "admit card" hero panel */}
        <View style={styles.admitCardWrap}>
          <LinearGradient
            colors={[colors.onyxRaised, colors.onyx]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.admitCard}
          >
            {/* diagonal gloss sheen */}
            <LinearGradient
              colors={[colors.glossHi, colors.glossLo, "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.6, y: 1 }}
              style={styles.sheen}
              pointerEvents="none"
            />
            <View style={styles.admitCardHeaderRow}>
              <Text style={styles.admitCardLabel}>ADMIT CARD</Text>
              <View style={styles.perfDots}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            </View>

            <BookOpen
              size={44}
              color={colors.chrome}
              strokeWidth={1.5}
              style={{ marginTop: 18, marginBottom: 14 }}
            />
            <Text style={styles.admitCardTitle}>Past Question Papers</Text>
            <Text style={styles.admitCardSubtitle}>
              Prepare better with previous exam papers
            </Text>

            <View style={styles.perforation} />

            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <View style={styles.statIconRing}>
                  <Book size={16} color={colors.chrome} strokeWidth={1.75} />
                </View>
                <Text style={styles.statValue}>
                  {papersLength.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Papers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <View style={styles.statIconRing}>
                  <Download
                    size={16}
                    color={colors.chrome}
                    strokeWidth={1.75}
                  />
                </View>
                <Text style={styles.statValue}>
                  {downloadCount.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Downloads</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {isLoggedIn && (
          <TouchableOpacity
            style={styles.attendanceCard}
            activeOpacity={0.85}
            onPress={handleAttendance}
          >
            <View style={styles.attendanceIconRing}>
              <CalendarCheck size={20} color={colors.chrome} strokeWidth={1.75} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.attendanceTitle}>Attendance</Text>
              <Text style={styles.attendanceSubtitle}>
                {activeSemester
                  ? `${Math.round(attendanceStats?.overall?.percentage ?? 0)}% overall`
                  : "Add your subjects to start tracking"}
              </Text>
            </View>
            <ArrowRight size={18} color={colors.steel} />
          </TouchableOpacity>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <GlossyButton
            label="Browse Question Papers"
            variant="primary"
            onPress={handleQuestionPapers}
            pressedKey={pressedKey}
            setPressedKey={setPressedKey}
            pressKey="papers"
          />

          <GlossyButton
            label="Browse Syllabus"
            variant="outline"
            onPress={handleSyllabus}
            pressedKey={pressedKey}
            setPressedKey={setPressedKey}
            pressKey="syllabus"
          />

          <GlossyButton
            label="Contribute Papers"
            variant="primary"
            icon={
              <Upload
                size={20}
                color={colors.void}
                strokeWidth={2}
                style={{ marginRight: 10 }}
              />
            }
            onPress={handleContribute}
            pressedKey={pressedKey}
            setPressedKey={setPressedKey}
            pressKey="contribute"
          />

          {user?.role === "admin" && (
            <GlossyButton
              label="Admin Dashboard"
              variant="admin"
              icon={
                <Star
                  size={18}
                  color={colors.chrome}
                  strokeWidth={2}
                  style={{ marginRight: 8 }}
                />
              }
              trailingIcon={
                pressedKey === "special" ? (
                  <ArrowRight size={16} color={colors.chrome} />
                ) : null
              }
              onPress={handleAdminDashboard}
              pressedKey={pressedKey}
              setPressedKey={setPressedKey}
              pressKey="special"
            />
          )}
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2026 NIT KKR PYQS. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const GlossyButton = ({
  label,
  variant,
  icon,
  trailingIcon,
  onPress,
  pressedKey,
  setPressedKey,
  pressKey,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const isPressed = pressedKey === pressKey;

  const containerStyle = [
    styles.btnBase,
    variant === "outline" && styles.btnOutline,
    variant === "admin" && styles.btnAdmin,
    isPressed && { transform: [{ scale: 0.98 }] },
  ];

  const textStyle = [
    styles.btnLabel,
    variant === "primary" && styles.btnLabelPrimary,
    variant === "outline" && styles.btnLabelOutline,
    variant === "admin" && styles.btnLabelAdmin,
  ];

  const body = (
    <View style={styles.btnContentRow}>
      {icon}
      <Text style={textStyle}>{label}</Text>
      {trailingIcon}
    </View>
  );

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPressIn={() => setPressedKey(pressKey)}
      onPressOut={() => setPressedKey(null)}
      onPress={onPress}
      style={containerStyle}
    >
      {variant === "primary" || variant === "admin" ? (
        <LinearGradient
          colors={
            variant === "admin"
              ? [colors.onyxRaised, colors.onyx]
              : [colors.chrome, colors.chromeSecondary]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {variant === "primary" || variant === "admin" ? (
        <LinearGradient
          colors={["rgba(255,255,255,0.35)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[
            StyleSheet.absoluteFill,
            { opacity: variant === "admin" ? 0.15 : 0.5 },
          ]}
          pointerEvents="none"
        />
      ) : null}
      {body}
    </TouchableOpacity>
  );
};

const CARD_W = Math.min(SCREEN_W - 48, 420);

const getStyles = (colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.void },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 48 },

    splash: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    splashRow: { flexDirection: "row", alignItems: "center" },
    splashText: {
      color: colors.chrome,
      fontSize: 32,
      fontWeight: "700",
      letterSpacing: 1,
      marginRight: 12,
    },

    heroTextBlock: { marginTop: 28, marginBottom: 24 },
    eyebrow: {
      color: colors.steel,
      fontSize: 12,
      fontWeight: "600",
      letterSpacing: 2,
      marginBottom: 10,
      textTransform: "uppercase",
    },
    heading: {
      color: colors.chrome,
      fontSize: 34,
      lineHeight: 40,
      fontWeight: "800",
      letterSpacing: -0.5,
      marginBottom: 14,
    },
    subheading: {
      color: colors.silver,
      fontSize: 15,
      lineHeight: 22,
    },

    admitCardWrap: {
      alignItems: "center",
      marginBottom: 32,
    },
    admitCard: {
      width: CARD_W,
      borderRadius: 22,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.hairline,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 18 },
      shadowOpacity: 0.55,
      shadowRadius: 30,
      elevation: 12,
    },
    sheen: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "60%",
    },
    admitCardHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    admitCardLabel: {
      color: colors.steel,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 3,
    },
    perfDots: { flexDirection: "row" },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.hairline,
      marginLeft: 5,
    },
    admitCardTitle: {
      color: colors.chrome,
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 6,
    },
    admitCardSubtitle: {
      color: colors.silver,
      fontSize: 13.5,
      lineHeight: 19,
    },
    perforation: {
      borderTopWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.hairline,
      marginTop: 22,
      marginBottom: 18,
    },
    statsRow: { flexDirection: "row", alignItems: "center" },
    statCell: { flex: 1, alignItems: "flex-start" },
    statIconRing: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: "rgba(255,255,255,0.03)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    statValue: {
      color: colors.chrome,
      fontSize: 20,
      fontWeight: "800",
    },
    statLabel: {
      color: colors.steel,
      fontSize: 12,
      fontWeight: "600",
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: 36,
      backgroundColor: colors.hairline,
      marginHorizontal: 16,
    },

    attendanceCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.onyxRaised,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: 16,
      marginBottom: 20,
    },
    attendanceIconRing: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: colors.onyx,
      borderWidth: 1,
      borderColor: colors.hairline,
      alignItems: "center",
      justifyContent: "center",
    },
    attendanceTitle: { color: colors.chrome, fontSize: 14.5, fontWeight: "700" },
    attendanceSubtitle: { color: colors.steel, fontSize: 12, marginTop: 3 },

    actions: { gap: 14, marginBottom: 20 },
    btnBase: {
      height: 56,
      borderRadius: 16,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.onyxRaised,
      borderWidth: 1,
      borderColor: colors.hairline,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 6,
    },
    btnOutline: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: colors.chrome,
    },
    btnAdmin: {
      borderColor: "#3A3A3D",
    },
    btnContentRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    btnLabel: {
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.2,
    },
    btnLabelPrimary: { color: colors.void },
    btnLabelOutline: { color: colors.chrome },
    btnLabelAdmin: { color: colors.chrome },

    footer: {
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
      alignItems: "center",
    },
    footerText: {
      color: colors.steel,
      fontSize: 12,
    },
  });

export default HomePage;
