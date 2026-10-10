import { useTheme } from "@/contexts/ThemeContext";
import { dateFromTime, timeFromDate, to12Hour } from "@/utils/time";
import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { Clock, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Optional time input. Stays empty until the user confirms a time in the
// native clock dialog (pick the hour, then the minutes, then OK); the "x"
// clears it again. `value` / `onChange` use "HH:mm" strings or null.
export default function TimePickerField({ label, value, onChange, style }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  // null while closed. The start time is captured once when the dialog opens:
  // passing a fresh `new Date()` on every render changes the native dialog's
  // initial value, which resets the dial if the screen re-renders mid-pick.
  const [pickerStart, setPickerStart] = useState(null);

  return (
    <View style={style}>
      <TouchableOpacity
        style={styles.field}
        activeOpacity={0.8}
        onPress={() => setPickerStart(dateFromTime(value))}
      >
        <Clock size={16} color={colors.steel} strokeWidth={1.75} />
        <Text
          style={[styles.text, !value && styles.placeholder]}
          numberOfLines={1}
        >
          {value ? to12Hour(value) : label}
        </Text>
        {value ? (
          <TouchableOpacity
            onPress={() => onChange(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={15} color={colors.steel} strokeWidth={2} />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>

      {/* The dialog opens itself on mount and must be unmounted when it
          closes; the zero-size Host keeps its native container out of the
          form's layout. */}
      {pickerStart && (
        <DateTimePicker
          mode="time"
          presentation="dialog"
          is24Hour={false}
          value={pickerStart}
          accentColor={colors.accent}
          style={styles.host}
          onValueChange={(_, date) => {
            setPickerStart(null);
            onChange(timeFromDate(date));
          }}
          onDismiss={() => setPickerStart(null)}
        />
      )}
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    field: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.onyx,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 48,
    },
    text: { flex: 1, color: colors.chrome, fontSize: 14 },
    placeholder: { color: colors.steel },
    host: { width: 0, height: 0 },
  });
