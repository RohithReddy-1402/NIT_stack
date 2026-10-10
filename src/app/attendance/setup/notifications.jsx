import PickerSheet from "@/components/attendance/PickerSheet";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useAttendanceSemesters } from "@/hooks/useAttendanceSemesters";
import { useSubjects } from "@/hooks/useSubjects";
import { useTimetable } from "@/hooks/useTimetable";
import {
  cancelAll,
  rescheduleAll,
  requestPermission,
} from "@/services/attendanceNotifications";
import {
  getNotificationLeadMinutes,
  getNotificationsEnabled,
  setNotificationLeadMinutes,
  setNotificationsEnabled,
} from "@/services/attendanceStorage";
import { router } from "expo-router";
import { Bell, ChevronDown, ChevronLeft } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LEAD_OPTIONS = [5, 10, 15, 20, 30];

export default function AttendanceNotificationSettingsScreen() {
  const { addToast } = useToast();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const { activeSemester } = useAttendanceSemesters();
  const { subjects } = useSubjects(activeSemester?.id);
  const { slots } = useTimetable(activeSemester?.id, subjects);

  const [enabled, setEnabled] = useState(false);
  const [leadMinutes, setLeadMinutes] = useState(10);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      setEnabled(await getNotificationsEnabled());
      setLeadMinutes(await getNotificationLeadMinutes());
      setLoaded(true);
    })();
  }, []);

  const subjectsById = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s])),
    [subjects],
  );

  const handleToggle = async (next) => {
    if (next) {
      const granted = await requestPermission();
      if (!granted) {
        addToast("Notification permission denied.", "error");
        return;
      }
      setEnabled(true);
      await setNotificationsEnabled(true);
      await rescheduleAll(slots, subjectsById, leadMinutes);
      addToast("Reminders enabled", "success");
    } else {
      setEnabled(false);
      await setNotificationsEnabled(false);
      await cancelAll();
      addToast("Reminders disabled", "success");
    }
  };

  const handleLeadChange = async (minutes) => {
    setLeadMinutes(minutes);
    setPickerOpen(false);
    await setNotificationLeadMinutes(minutes);
    if (enabled) {
      await rescheduleAll(slots, subjectsById, minutes);
    }
  };

  if (!loaded) return null;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.brand}>Notifications</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <Bell size={18} color={colors.chrome} strokeWidth={1.75} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Class reminders</Text>
            <Text style={styles.rowSubtitle}>
              Get notified before each class starts
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ true: colors.accent, false: colors.hairline }}
          />
        </View>

        <TouchableOpacity
          style={[styles.row, !enabled && styles.rowDisabled]}
          activeOpacity={0.8}
          disabled={!enabled}
          onPress={() => setPickerOpen(true)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Remind me before class</Text>
            <Text style={styles.rowSubtitle}>{leadMinutes} minutes</Text>
          </View>
          <ChevronDown size={16} color={colors.steel} />
        </TouchableOpacity>
      </View>

      <PickerSheet
        visible={pickerOpen}
        title="Lead time"
        options={LEAD_OPTIONS.map((m) => ({ label: `${m} minutes`, value: m }))}
        onSelect={handleLeadChange}
        onClose={() => setPickerOpen(false)}
      />
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
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    brand: { color: colors.chrome, fontSize: 17, fontWeight: "700", flex: 1, textAlign: "center" },

    content: { padding: 20 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: colors.onyxRaised,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: 16,
      marginBottom: 12,
    },
    rowDisabled: { opacity: 0.5 },
    rowIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: colors.onyx,
      borderWidth: 1,
      borderColor: colors.hairline,
      alignItems: "center",
      justifyContent: "center",
    },
    rowLabel: { color: colors.chrome, fontSize: 14.5, fontWeight: "700" },
    rowSubtitle: { color: colors.steel, fontSize: 12, marginTop: 2 },
  });
