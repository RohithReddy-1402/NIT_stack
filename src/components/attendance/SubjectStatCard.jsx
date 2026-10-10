import { useTheme } from "@/contexts/ThemeContext";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

const LOW_ATTENDANCE_THRESHOLD = 75;

export default function SubjectStatCard({ subject, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const hasClasses = subject.conducted > 0;
  const low = hasClasses && subject.percentage < LOW_ATTENDANCE_THRESHOLD;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <Text style={styles.name} numberOfLines={1}>
        {subject.name}
      </Text>
      {subject.code ? <Text style={styles.code}>{subject.code}</Text> : null}

      <Text style={[styles.value, low && { color: colors.danger }]}>
        {hasClasses ? `${Math.round(subject.percentage)}%` : "–"}
      </Text>
      <Text style={styles.label}>
        {hasClasses
          ? `${subject.attended}/${subject.conducted} attended`
          : "No classes marked yet"}
      </Text>
    </TouchableOpacity>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      width: 150,
      backgroundColor: colors.onyxRaised,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: 14,
      marginRight: 12,
    },
    name: { color: colors.chrome, fontSize: 13.5, fontWeight: "700" },
    code: { color: colors.steel, fontSize: 11, marginTop: 2, marginBottom: 10 },
    value: { color: colors.chrome, fontSize: 22, fontWeight: "800" },
    label: { color: colors.steel, fontSize: 11.5, marginTop: 2 },
  });
