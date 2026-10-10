import PickerSheet from "@/components/attendance/PickerSheet";
import TimePickerField from "@/components/attendance/TimePickerField";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { DAYS_OF_WEEK } from "@/constants/attendance";
import { useAttendanceSemesters } from "@/hooks/useAttendanceSemesters";
import { useSubjects } from "@/hooks/useSubjects";
import { useTimetable } from "@/hooks/useTimetable";
import {
  formatTimeRange,
  fromApiTimes,
  timeError,
  toApiTimes,
} from "@/utils/time";
import { router } from "expo-router";
import { ChevronLeft, Plus, Trash2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ManageTimetableScreen() {
  const { addToast } = useToast();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const { activeSemester, loading: semesterLoading } =
    useAttendanceSemesters();
  const { subjects } = useSubjects(activeSemester?.id);
  const { slots, addSlot, removeSlot } = useTimetable(
    activeSemester?.id,
    subjects,
  );

  const [dayOfWeek, setDayOfWeek] = useState(1); // default Monday
  const [formOpen, setFormOpen] = useState(false);
  const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);
  const [subjectId, setSubjectId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const subjectsById = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s])),
    [subjects],
  );

  // Untimed classes have no start time, so they sort after the timed ones.
  const sortKey = (slot) =>
    fromApiTimes(slot.startTime, slot.endTime).startTime ?? "~";
  const daySlots = slots
    .filter((s) => s.dayOfWeek === dayOfWeek)
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

  const resetForm = () => {
    setFormOpen(false);
    setSubjectId(null);
    setStartTime(null);
    setEndTime(null);
  };

  // Times are optional: only the subject is required.
  const handleAdd = async () => {
    if (!subjectId) return;
    const invalid = timeError(startTime, endTime);
    if (invalid) {
      addToast(invalid, "error");
      return;
    }
    setSubmitting(true);
    try {
      await addSlot({
        subjectId,
        dayOfWeek,
        ...toApiTimes(startTime, endTime),
      });
      addToast("Slot added", "success");
      resetForm();
    } catch (err) {
      addToast(err?.message || "Failed to add slot.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (slot) => {
    Alert.alert("Remove slot", "Remove this class from the timetable?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeSlot(slot.id);
          } catch {
            addToast("Failed to remove slot.", "error");
          }
        },
      },
    ]);
  };

  if (!activeSemester) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.brand}>Timetable</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.emptyState}>
          {semesterLoading ? (
            <ActivityIndicator color={colors.chrome} />
          ) : (
            <Text style={styles.emptyTitle}>
              Couldn&apos;t load attendance. Check your connection.
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.brand}>Weekly Timetable</Text>
        <TouchableOpacity onPress={() => setFormOpen(true)} style={styles.backBtn}>
          <Plus size={20} color={colors.chrome} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayTabsScroll}
        contentContainerStyle={styles.dayTabs}
      >
        {DAYS_OF_WEEK.map((day) => (
          <TouchableOpacity
            key={day.value}
            style={[styles.dayTab, dayOfWeek === day.value && styles.dayTabActive]}
            onPress={() => setDayOfWeek(day.value)}
          >
            <Text
              style={[
                styles.dayTabText,
                dayOfWeek === day.value && styles.dayTabTextActive,
              ]}
            >
              {day.short}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {daySlots.length === 0 ? (
          <Text style={styles.noSlotsText}>No classes on this day.</Text>
        ) : (
          daySlots.map((slot) => (
            <View key={slot.id} style={styles.slotCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.slotSubject}>
                  {subjectsById[slot.subjectId]?.name ?? "Unknown subject"}
                </Text>
                <Text style={styles.slotTime}>
                  {formatTimeRange(slot.startTime, slot.endTime) || "No time set"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(slot)}>
                <Trash2 size={16} color={colors.danger} strokeWidth={1.75} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {formOpen && (
        <View style={styles.addFormOverlay}>
          <View style={styles.addForm}>
            <Text style={styles.sheetTitle}>
              Add class · {DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)?.label}
            </Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setSubjectPickerOpen(true)}
            >
              <Text style={styles.selectText}>
                {subjectsById[subjectId]?.name || "Select subject"}
              </Text>
            </TouchableOpacity>

            <View style={styles.row}>
              <TimePickerField
                style={styles.half}
                label="Start time"
                value={startTime}
                onChange={setStartTime}
              />
              <TimePickerField
                style={styles.half}
                label="End time"
                value={endTime}
                onChange={setEndTime}
              />
            </View>
            <Text style={styles.hint}>
              Times are optional — leave them blank if you don&apos;t need them.
            </Text>

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (!subjectId || submitting) && styles.submitBtnDisabled,
                ]}
                disabled={!subjectId || submitting}
                onPress={handleAdd}
              >
                <Text style={styles.submitText}>
                  {submitting ? "Adding..." : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <PickerSheet
        visible={subjectPickerOpen}
        title="Select subject"
        options={subjects}
        getLabel={(s) => s.name}
        getValue={(s) => s.id}
        onSelect={(id) => {
          setSubjectId(id);
          setSubjectPickerOpen(false);
        }}
        onClose={() => setSubjectPickerOpen(false)}
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
    brand: { color: colors.chrome, fontSize: 16, fontWeight: "700", flex: 1, textAlign: "center" },

    // A ScrollView grows to fill spare column height by default, which
    // stretched these tabs to half the screen.
    dayTabsScroll: { flexGrow: 0 },
    dayTabs: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    dayTab: {
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.onyxRaised,
    },
    dayTabActive: { backgroundColor: colors.chrome, borderColor: colors.chrome },
    dayTabText: { color: colors.steel, fontSize: 13, fontWeight: "700" },
    dayTabTextActive: { color: colors.void },

    content: { padding: 20, paddingBottom: 140 },
    noSlotsText: { color: colors.steel, fontSize: 13.5 },
    slotCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.onyxRaised,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: 14,
      marginBottom: 12,
    },
    slotSubject: { color: colors.chrome, fontSize: 14.5, fontWeight: "700" },
    slotTime: { color: colors.steel, fontSize: 12.5, marginTop: 3 },

    // Sits above the floating tab bar (72px tall, zIndex 100) — anchored to
    // the very bottom, the form's Cancel/Add buttons were hidden behind it.
    addFormOverlay: { position: "absolute", left: 0, right: 0, bottom: 92, padding: 20 },
    addForm: {
      backgroundColor: colors.onyxRaised,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: 16,
    },
    sheetTitle: { color: colors.chrome, fontSize: 15, fontWeight: "700", marginBottom: 14 },
    selectInput: {
      backgroundColor: colors.onyx,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 48,
      justifyContent: "center",
      marginBottom: 12,
    },
    selectText: { color: colors.chrome, fontSize: 14 },
    row: { flexDirection: "row", gap: 12 },
    half: { flex: 1 },
    hint: { color: colors.steel, fontSize: 12, lineHeight: 16, marginTop: 10, marginBottom: 2 },

    formActions: { flexDirection: "row", gap: 12, marginTop: 4 },
    cancelBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    cancelText: { color: colors.silver, fontSize: 14, fontWeight: "700" },
    submitBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.chrome,
    },
    submitBtnDisabled: { opacity: 0.4 },
    submitText: { color: colors.void, fontSize: 14, fontWeight: "700" },

    emptyState: { flex: 1, alignItems: "center", justifyContent: "center" },
    emptyTitle: { color: colors.chrome, fontSize: 15, fontWeight: "700" },
  });
