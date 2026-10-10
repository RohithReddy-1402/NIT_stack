import PickerSheet from "@/components/attendance/PickerSheet";
import { useTheme } from "@/contexts/ThemeContext";
import { ChevronDown, Clock, Flame, Trophy } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

const SORT_ICONS = { hot: Flame, new: Clock, top: Trophy };
const SORT_LABELS = { hot: "Hot", new: "New", top: "Top" };
export const TOP_RANGES = [
  { value: "hour", label: "Past hour" },
  { value: "day", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "year", label: "This year" },
  { value: "all", label: "All time" },
];

/** Hot / New / Top chips; Top adds a time-range chip. `extra` renders more chips at the start. */
export default function SortBar({ sort, t, onChange, sorts = ["hot", "new", "top"], extra }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [rangeOpen, setRangeOpen] = useState(false);

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {extra}
        {sorts.map((s) => {
          const Icon = SORT_ICONS[s];
          const active = s === sort;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => (s === "top" && active ? setRangeOpen(true) : onChange({ sort: s, t }))}
            >
              <Icon size={14} color={active ? colors.void : colors.silver} strokeWidth={2} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{SORT_LABELS[s]}</Text>
            </TouchableOpacity>
          );
        })}
        {sort === "top" ? (
          <TouchableOpacity style={styles.chip} onPress={() => setRangeOpen(true)}>
            <Text style={styles.chipText}>{TOP_RANGES.find((r) => r.value === t)?.label ?? "Today"}</Text>
            <ChevronDown size={14} color={colors.silver} />
          </TouchableOpacity>
        ) : null}
      </ScrollView>
      <PickerSheet
        visible={rangeOpen}
        title="Top posts from"
        options={TOP_RANGES}
        onSelect={(value) => {
          setRangeOpen(false);
          onChange({ sort: "top", t: value });
        }}
        onClose={() => setRangeOpen(false)}
      />
    </>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    row: { gap: 8, paddingVertical: 4 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      height: 32,
      paddingHorizontal: 13,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
    },
    chipActive: { backgroundColor: colors.chrome, borderColor: colors.chrome },
    chipText: { color: colors.silver, fontSize: 13, fontWeight: "600" },
    chipTextActive: { color: colors.void },
  });
