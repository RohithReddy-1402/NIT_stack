import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import { Bell, BookOpen, CalendarClock, Plus, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const ACTIONS = [
  { key: "subject", label: "Add Subject", icon: BookOpen, route: "attendance/setup/subjects" },
  { key: "timetable", label: "Add Timing", icon: CalendarClock, route: "attendance/setup/timetable" },
  { key: "notifications", label: "Notifications", icon: Bell, route: "attendance/setup/notifications" },
];

// Quick-add shortcut sitting above the floating tab bar on the attendance
// dashboard — a speed-dial style menu into the setup screens.
export default function AttendanceFab() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [open, setOpen] = useState(false);

  const handleAction = (route) => {
    setOpen(false);
    router.push(route);
  };

  return (
    <>
      {open && <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />}

      <View style={styles.container} pointerEvents="box-none">
        {open && (
          <View style={styles.menu}>
            {ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.key}
                style={styles.menuItem}
                activeOpacity={0.85}
                onPress={() => handleAction(action.route)}
              >
                <Text style={styles.menuItemText}>{action.label}</Text>
                <View style={styles.menuItemIcon}>
                  <action.icon size={16} color={colors.void} strokeWidth={2} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => setOpen((v) => !v)}
        >
          {open ? (
            <X size={24} color={colors.void} strokeWidth={2.5} />
          ) : (
            <Plus size={24} color={colors.void} strokeWidth={2.5} />
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    backdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 95,
    },
    container: {
      position: "absolute",
      right: 20,
      bottom: 96,
      alignItems: "flex-end",
      zIndex: 101,
    },
    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.chrome,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
    },
    menu: { marginBottom: 14, gap: 10 },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.onyxRaised,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: 24,
      paddingLeft: 16,
      paddingRight: 6,
      paddingVertical: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    menuItemText: { color: colors.chrome, fontSize: 13, fontWeight: "700" },
    menuItemIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.chrome,
      alignItems: "center",
      justifyContent: "center",
    },
  });
