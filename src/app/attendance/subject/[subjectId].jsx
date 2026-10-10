import SubjectCalendarGrid from "@/components/attendance/SubjectCalendarGrid";
import TimePickerField from "@/components/attendance/TimePickerField";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { STATUS, STATUS_LABELS } from "@/constants/attendance";
import { useAttendanceSemesters } from "@/hooks/useAttendanceSemesters";
import { useSubjectCalendar } from "@/hooks/useSubjectCalendar";
import { formatTimeRange, fromApiTimes, timeError, toApiTimes } from "@/utils/time";
import { addMonths, format, subMonths } from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STATUS_OPTIONS = [STATUS.PRESENT, STATUS.ABSENT, STATUS.CANCELLED];

export default function SubjectCalendarScreen() {
  const { subjectId, name, code } = useLocalSearchParams();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [month, setMonth] = useState(new Date());

  const { activeSemester } = useAttendanceSemesters();
  const { days, loading, addEntry, removeEntry } = useSubjectCalendar(
    activeSemester?.id,
    subjectId,
    format(month, "yyyy-MM"),
  );
  const daysByDate = useMemo(() => {
    const map = {};
    for (const d of days) map[d.date] = d;
    return map;
  }, [days]);

  const [daySheet, setDaySheet] = useState(null); // {date} | null
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [sheetStart, setSheetStart] = useState(null);
  const [sheetEnd, setSheetEnd] = useState(null);
  const [submittingStatus, setSubmittingStatus] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  // Re-derive from `days` on every render so an add/remove is reflected in
  // the open sheet immediately, without keeping a separate copy of state.
  const daySheetRecords = daySheet ? daysByDate[daySheet.date]?.records ?? [] : [];

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [authLoading, isLoggedIn]);

  if (!isLoggedIn) return null;

  const openDaySheet = (date, info) => {
    setDaySheet({ date });
    // A day with no entries yet goes straight into the add form — the
    // common case of marking today's class shouldn't need an extra tap.
    setAddFormOpen(!(info?.records?.length > 0));
    const slotTimes = fromApiTimes(info?.slotStartTime, info?.slotEndTime);
    setSheetStart(slotTimes.startTime);
    setSheetEnd(slotTimes.endTime);
  };

  const closeDaySheet = () => {
    setDaySheet(null);
    setAddFormOpen(false);
    setSheetStart(null);
    setSheetEnd(null);
    setSubmittingStatus(null);
    setRemovingId(null);
  };

  const openAddForm = () => {
    setSheetStart(null);
    setSheetEnd(null);
    setAddFormOpen(true);
  };

  // Times are optional: an entry can be marked with no time at all.
  const handleAdd = async (status) => {
    if (!daySheet) return;
    const invalid = timeError(sheetStart, sheetEnd);
    if (invalid) {
      addToast(invalid, "error");
      return;
    }
    setSubmittingStatus(status);
    try {
      await addEntry(daySheet.date, { ...toApiTimes(sheetStart, sheetEnd), status });
      addToast("Attendance saved", "success");
      setSheetStart(null);
      setSheetEnd(null);
      setAddFormOpen(false);
    } catch (err) {
      addToast(err?.message || "Failed to save attendance.", "error");
    } finally {
      setSubmittingStatus(null);
    }
  };

  const handleRemove = async (recordId) => {
    if (!daySheet) return;
    setRemovingId(recordId);
    try {
      await removeEntry(daySheet.date, recordId);
      addToast("Entry cleared", "success");
    } catch {
      addToast("Failed to clear entry.", "error");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand} numberOfLines={1}>
            {name || "Subject"}
          </Text>
          {code ? <Text style={styles.brandSub}>{code}</Text> : null}
        </View>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.content}>
        <View style={styles.monthRow}>
          <TouchableOpacity onPress={() => setMonth((m) => subMonths(m, 1))}>
            <ChevronLeft size={20} color={colors.chrome} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{format(month, "MMMM yyyy")}</Text>
          <TouchableOpacity onPress={() => setMonth((m) => addMonths(m, 1))}>
            <ChevronRight size={20} color={colors.chrome} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.chrome} style={{ marginTop: 30 }} />
        ) : (
          <SubjectCalendarGrid month={month} days={days} onSelectDay={openDaySheet} />
        )}

        <Text style={styles.hint}>
          Tinted days follow your timetable. Tap any day — even one without a
          class — to mark it, and add more than one entry for the same day if
          you had extra sessions. Class times are optional.
        </Text>
      </View>

      <Modal visible={!!daySheet} transparent animationType="slide" onRequestClose={closeDaySheet}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeDaySheet}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {daySheet ? format(new Date(`${daySheet.date}T00:00:00`), "EEEE, MMM d") : ""}
            </Text>

            {daySheetRecords.length > 0 && (
              <View style={styles.entryList}>
                {daySheetRecords.map((entry) => {
                  const color =
                    entry.status === STATUS.PRESENT
                      ? colors.success
                      : entry.status === STATUS.ABSENT
                        ? colors.danger
                        : colors.steel;
                  return (
                    <View key={entry.recordId} style={styles.entryRow}>
                      <Text style={styles.entryTime}>
                        {formatTimeRange(entry.startTime, entry.endTime) || "No time set"}
                      </Text>
                      <View style={[styles.entryStatusPill, { borderColor: color }]}>
                        <Text style={[styles.entryStatusText, { color }]}>
                          {STATUS_LABELS[entry.status]}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemove(entry.recordId)}
                        disabled={removingId === entry.recordId}
                        hitSlop={8}
                      >
                        <X size={16} color={colors.steel} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {addFormOpen ? (
              <>
                <View style={styles.row}>
                  <TimePickerField
                    style={styles.half}
                    label="Start time"
                    value={sheetStart}
                    onChange={setSheetStart}
                  />
                  <TimePickerField
                    style={styles.half}
                    label="End time"
                    value={sheetEnd}
                    onChange={setSheetEnd}
                  />
                </View>

                <View style={styles.statusRow}>
                  {STATUS_OPTIONS.map((status) => {
                    const color =
                      status === STATUS.PRESENT
                        ? colors.success
                        : status === STATUS.ABSENT
                          ? colors.danger
                          : colors.steel;

                    return (
                      <TouchableOpacity
                        key={status}
                        style={[styles.statusBtn, { borderColor: color }]}
                        disabled={submittingStatus === status}
                        onPress={() => handleAdd(status)}
                      >
                        <Text style={[styles.statusBtnText, { color }]}>
                          {submittingStatus === status ? "Saving..." : STATUS_LABELS[status]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : (
              <TouchableOpacity style={styles.addEntryBtn} onPress={openAddForm}>
                <Plus size={16} color={colors.chrome} strokeWidth={2} />
                <Text style={styles.addEntryText}>Add class</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    brand: { color: colors.chrome, fontSize: 17, fontWeight: "700", textAlign: "center" },
    brandSub: { color: colors.steel, fontSize: 12, textAlign: "center", marginTop: 2 },

    content: { padding: 20 },
    monthRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    monthLabel: { color: colors.chrome, fontSize: 16, fontWeight: "700" },
    hint: { color: colors.steel, fontSize: 12, lineHeight: 17, marginTop: 20 },

    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    sheet: {
      backgroundColor: colors.onyxRaised,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 30,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.hairline,
      alignSelf: "center",
      marginBottom: 14,
    },
    sheetTitle: { color: colors.chrome, fontSize: 16, fontWeight: "700", marginBottom: 16 },

    row: { flexDirection: "row", gap: 12, marginBottom: 16 },
    half: { flex: 1 },

    statusRow: { flexDirection: "row", gap: 10 },
    statusBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 13,
      borderRadius: 12,
      borderWidth: 1.5,
    },
    statusBtnText: { fontSize: 13.5, fontWeight: "700" },

    entryList: { marginBottom: 16, gap: 10 },
    entryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.onyx,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    entryTime: { flex: 1, color: colors.chrome, fontSize: 13.5, fontWeight: "600" },
    entryStatusPill: {
      borderWidth: 1.5,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    entryStatusText: { fontSize: 12, fontWeight: "700" },

    addEntryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    addEntryText: { color: colors.chrome, fontSize: 14, fontWeight: "700" },
  });
