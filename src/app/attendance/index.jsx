import AttendanceFab from "@/components/attendance/AttendanceFab";
import PeriodCard from "@/components/attendance/PeriodCard";
import SubjectStatCard from "@/components/attendance/SubjectStatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useAttendanceDay } from "@/hooks/useAttendanceDay";
import { useAttendanceSemesters } from "@/hooks/useAttendanceSemesters";
import { useAttendanceStats } from "@/hooks/useAttendanceStats";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { useSubjects } from "@/hooks/useSubjects";
import { onTabReselect } from "@/utils/tabRefresh";
import { format } from "date-fns";
import { router } from "expo-router";
import {
  ClipboardList,
  HelpCircle,
  Settings,
  WifiOff,
} from "lucide-react-native";
import { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TODAY = format(new Date(), "yyyy-MM-dd");

export default function AttendanceDashboard() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const {
    activeSemester,
    loading: semestersLoading,
    refetch: refetchSemesters,
  } = useAttendanceSemesters();
  const {
    stats,
    loading: statsLoading,
    refetch: refetchStats,
  } = useAttendanceStats(activeSemester?.id);
  const {
    subjects,
    loading: subjectsLoading,
    error: subjectsError,
    refetch: refetchSubjects,
  } = useSubjects(activeSemester?.id);
  const {
    periods,
    loading: dayLoading,
    markPeriod,
    refetch: refetchDay,
  } = useAttendanceDay(activeSemester?.id, TODAY);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [authLoading, isLoggedIn]);

  // Subjects, timetable and marks are edited on screens pushed on top of this
  // one, so reload when coming back to see the changes.
  useRefetchOnFocus(() => {
    refetchSubjects();
    refetchStats();
    refetchDay();
  });

  // Re-tapping the Attend tab while already on it has nowhere to navigate
  // to, so treat it as a pull-to-refresh instead.
  useEffect(
    () =>
      onTabReselect((key) => {
        if (key !== "/attendance") return;
        refetchSemesters();
        refetchSubjects();
        refetchStats();
        refetchDay();
      }),
    [refetchSemesters, refetchSubjects, refetchStats, refetchDay],
  );

  if (!isLoggedIn) return null;

  const handleMark = async (period, status) => {
    try {
      await markPeriod(period, status);
    } catch (err) {
      addToast(err?.message || "Failed to save attendance.", "error");
    }
  };

  const topBar = (
    <View style={styles.topBar}>
      <Text style={styles.brand}>Attendance</Text>
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={() => router.push("attendance/setup/help")}
      >
        <HelpCircle size={20} color={colors.chrome} strokeWidth={1.75} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={() => router.push("attendance/setup")}
      >
        <Settings size={20} color={colors.chrome} strokeWidth={1.75} />
      </TouchableOpacity>
    </View>
  );

  const loadFailed =
    (!semestersLoading && !activeSemester) ||
    (!!subjectsError && subjects.length === 0);

  if (loadFailed) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        {topBar}
        <View style={styles.emptyState}>
          <WifiOff size={44} color={colors.steel} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Couldn&apos;t load attendance</Text>
          <Text style={styles.emptySubtitle}>
            Check your internet connection and try again.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            activeOpacity={0.85}
            onPress={() => {
              refetchSemesters();
              refetchSubjects();
              refetchStats();
            }}
          >
            <Text style={styles.emptyBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (semestersLoading && !activeSemester) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        {topBar}
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.chrome} />
        </View>
      </SafeAreaView>
    );
  }

  // Driven by the real subject list (not the stats payload) so a subject
  // that has no marked classes yet still shows up and opens its calendar.
  const statsBySubject = Object.fromEntries(
    (stats?.subjects ?? []).map((s) => [s.subjectId, s]),
  );
  const subjectCards = subjects.map(
    (subject) =>
      statsBySubject[subject.id] ?? {
        subjectId: subject.id,
        name: subject.name,
        code: subject.code,
        percentage: 0,
        attended: 0,
        conducted: 0,
      },
  );

  if (!subjectsLoading && subjectCards.length === 0) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        {topBar}
        <View style={styles.emptyState}>
          <ClipboardList size={44} color={colors.steel} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No subjects yet</Text>
          <Text style={styles.emptySubtitle}>
            Add the subjects you&apos;re tracking and mark attendance for any
            date. New here? Check the help guide for a walkthrough.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            activeOpacity={0.85}
            onPress={() => router.push("attendance/setup/subjects")}
          >
            <Text style={styles.emptyBtnText}>Add a subject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.emptySecondaryBtn}
            activeOpacity={0.7}
            onPress={() => router.push("attendance/setup/help")}
          >
            <Text style={styles.emptySecondaryBtnText}>How does this work?</Text>
          </TouchableOpacity>
        </View>
        <AttendanceFab />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {topBar}

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.overallCard}>
          {statsLoading ? (
            <ActivityIndicator color={colors.chrome} />
          ) : (
            <>
              <Text style={styles.overallValue}>
                {Math.round(stats?.overall?.percentage ?? 0)}%
              </Text>
              <Text style={styles.overallLabel}>
                Overall attendance · {stats?.overall?.attended ?? 0}/
                {stats?.overall?.conducted ?? 0} classes
              </Text>
            </>
          )}
        </View>

        {subjectCards.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>By subject</Text>
            <Text style={styles.sectionHint}>
              Tap a subject to open its calendar and mark any date.
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 4 }}
            >
              {subjectCards.map((subject) => (
                <SubjectStatCard
                  key={subject.subjectId}
                  subject={subject}
                  onPress={() =>
                    router.push({
                      pathname: "attendance/subject/[subjectId]",
                      params: {
                        subjectId: subject.subjectId,
                        name: subject.name,
                        code: subject.code ?? "",
                      },
                    })
                  }
                />
              ))}
            </ScrollView>
          </>
        )}

        <Text style={styles.sectionHeading}>Today&apos;s classes</Text>
        {dayLoading ? (
          <ActivityIndicator color={colors.chrome} />
        ) : periods.length === 0 ? (
          <Text style={styles.noClassesText}>No classes scheduled today.</Text>
        ) : (
          periods.map((period, i) => (
            <PeriodCard
              key={period.slotId ?? i}
              period={period}
              onMark={handleMark}
            />
          ))
        )}
      </ScrollView>

      <AttendanceFab />
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    brand: { color: colors.chrome, fontSize: 19, fontWeight: "800", flex: 1 },
    iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },

    content: { padding: 20, paddingBottom: 100 },

    overallCard: {
      backgroundColor: colors.onyxRaised,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: 22,
      alignItems: "center",
      marginBottom: 24,
    },
    overallValue: { color: colors.chrome, fontSize: 40, fontWeight: "800" },
    overallLabel: { color: colors.steel, fontSize: 13, marginTop: 6 },

    sectionHeading: {
      color: colors.steel,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 12,
      marginTop: 8,
    },
    sectionHint: {
      color: colors.steel,
      fontSize: 12.5,
      lineHeight: 17,
      marginTop: -6,
      marginBottom: 12,
    },

    noClassesText: { color: colors.steel, fontSize: 13.5, marginBottom: 20 },

    emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
    emptyTitle: { color: colors.chrome, fontSize: 16, fontWeight: "700", marginTop: 16 },
    emptySubtitle: {
      color: colors.steel,
      fontSize: 13.5,
      textAlign: "center",
      marginTop: 8,
      lineHeight: 19,
    },
    emptyBtn: {
      backgroundColor: colors.chrome,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 24,
      marginTop: 22,
    },
    emptyBtnText: { color: colors.void, fontSize: 14, fontWeight: "700" },
    emptySecondaryBtn: { marginTop: 14, paddingVertical: 6 },
    emptySecondaryBtnText: {
      color: colors.steel,
      fontSize: 13,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
  });
