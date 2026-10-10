import { useTheme } from "@/contexts/ThemeContext";
import { STATUS, STATUS_LABELS } from "@/constants/attendance";
import { formatTimeRange } from "@/utils/time";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const OPTIONS = [STATUS.PRESENT, STATUS.ABSENT, STATUS.CANCELLED];

export default function PeriodCard({ period, onMark }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  // Class times are optional, so either part of this line can be missing.
  const meta = [
    period.subjectCode,
    formatTimeRange(period.startTime, period.endTime),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.subject} numberOfLines={1}>
          {period.subjectName}
        </Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>

      <View style={styles.segmented}>
        {OPTIONS.map((status) => {
          const active = period.status === status;
          const color =
            status === STATUS.PRESENT
              ? colors.success
              : status === STATUS.ABSENT
                ? colors.danger
                : colors.steel;

          return (
            <TouchableOpacity
              key={status}
              style={[
                styles.segment,
                active && { backgroundColor: color, borderColor: color },
              ]}
              activeOpacity={0.8}
              onPress={() => onMark(period, status)}
            >
              <Text
                style={[
                  styles.segmentText,
                  active && styles.segmentTextActive,
                ]}
              >
                {STATUS_LABELS[status]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.onyxRaised,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: 14,
      marginBottom: 12,
    },
    info: { marginBottom: 12 },
    subject: { color: colors.chrome, fontSize: 15, fontWeight: "700" },
    meta: { color: colors.steel, fontSize: 12.5, marginTop: 3 },
    segmented: { flexDirection: "row", gap: 8 },
    segment: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 9,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    segmentText: { color: colors.steel, fontSize: 12.5, fontWeight: "700" },
    segmentTextActive: { color: colors.void },
  });
