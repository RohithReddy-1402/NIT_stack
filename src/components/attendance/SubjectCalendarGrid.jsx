import { useTheme } from "@/contexts/ThemeContext";
import { statusColor } from "@/constants/attendance";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameMonth,
  isToday,
  startOfMonth,
} from "date-fns";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MAX_DOTS = 4;

// `days` is `[{date, hasSlot, records: [{recordId, startTime, endTime,
// status}]}]` for one subject over the month — a day can carry more than one
// record (e.g. two separate sessions). Days with a regular timetable slot
// for this subject get a tinted circle. A single marked day fills the whole
// circle with its status color; a day with several entries instead shows one
// small colored dot per entry (green/red/grey) below the circle, so a mixed
// day (e.g. present + absent) is visible at a glance instead of being
// collapsed into one color.
export default function SubjectCalendarGrid({ month, days, onSelectDay }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const infoByDate = useMemo(() => {
    const map = {};
    for (const d of days ?? []) map[d.date] = { ...d, records: d.records ?? [] };
    return map;
  }, [days]);

  // Fixed 7-cell week rows rather than a flex-wrap grid with percentage-width
  // cells: percentage widths that don't divide evenly into the container can
  // round up by a pixel across 7 columns, pushing the 7th (Saturday) cell
  // onto the next row and shifting every date over by one weekday.
  const weeks = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const leadingBlanks = getDay(monthStart);
    const trailingBlanks = 6 - getDay(monthEnd);

    const cells = [
      ...Array.from({ length: leadingBlanks }, () => null),
      ...monthDays,
      ...Array.from({ length: trailingBlanks }, () => null),
    ];

    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [month]);

  return (
    <View>
      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text key={i} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            if (!day) return <View key={di} style={styles.cell} />;

            const dateStr = format(day, "yyyy-MM-dd");
            const info = infoByDate[dateStr];
            const isCurrentMonth = isSameMonth(day, month);
            const records = info?.records ?? [];
            const singleStatus = records.length === 1 ? records[0].status : null;

            return (
              <TouchableOpacity
                key={di}
                style={styles.cell}
                activeOpacity={0.7}
                onPress={() => onSelectDay(dateStr, info)}
                disabled={!isCurrentMonth}
              >
                <View
                  style={[
                    styles.dayCircle,
                    info?.hasSlot && records.length === 0 && styles.dayCircleClassDay,
                    singleStatus && { backgroundColor: statusColor(singleStatus, colors) },
                    isToday(day) && styles.dayCircleToday,
                  ]}
                >
                  <Text style={[styles.dayText, singleStatus && styles.dayTextFilled]}>
                    {format(day, "d")}
                  </Text>
                </View>
                {records.length > 1 && (
                  <View style={styles.dotsRow}>
                    {records.slice(0, MAX_DOTS).map((r) => (
                      <View
                        key={r.recordId}
                        style={[styles.statusDot, { backgroundColor: statusColor(r.status, colors) }]}
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    weekRow: { flexDirection: "row" },
    weekdayLabel: {
      flex: 1,
      textAlign: "center",
      color: colors.steel,
      fontSize: 11.5,
      fontWeight: "700",
      marginBottom: 6,
    },
    cell: { flex: 1, alignItems: "center", paddingVertical: 6, position: "relative" },
    dayCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    dayCircleClassDay: {
      backgroundColor: colors.glassFillRaised,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    dayCircleToday: { borderWidth: 1.5, borderColor: colors.accent },
    dayText: { color: colors.chrome, fontSize: 13 },
    dayTextFilled: { color: colors.void, fontWeight: "700" },
    // One dot per entry when a day has more than one, colored by that
    // entry's own status — so a mixed day stays legible instead of
    // collapsing to a single color.
    dotsRow: { flexDirection: "row", gap: 3, marginTop: 3 },
    statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  });
