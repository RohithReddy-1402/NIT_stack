import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import {
  Bell,
  BookOpen,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from "lucide-react-native";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SECTIONS = [
  {
    key: "subjects",
    label: "Subjects",
    description: "Add and manage the subjects you're tracking",
    icon: BookOpen,
    route: "attendance/setup/subjects",
  },
  {
    key: "timetable",
    label: "Weekly Timetable",
    description: "Assign subjects to days — class times are optional",
    icon: CalendarClock,
    route: "attendance/setup/timetable",
  },
  {
    key: "notifications",
    label: "Notifications",
    description: "Get reminded before each class starts",
    icon: Bell,
    route: "attendance/setup/notifications",
  },
  {
    key: "help",
    label: "Help & Guide",
    description: "How to set up subjects, timetable, and reminders",
    icon: HelpCircle,
    route: "attendance/setup/help",
  },
];

export default function AttendanceSetupHub() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.brand}>Attendance Setup</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.content}>
        {SECTIONS.map((section) => (
          <TouchableOpacity
            key={section.key}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => router.push(section.route)}
          >
            <View style={styles.cardIconBox}>
              <section.icon size={22} color={colors.chrome} strokeWidth={1.75} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.cardTitle}>{section.label}</Text>
              <Text style={styles.cardDescription}>{section.description}</Text>
            </View>
            <ChevronRight size={18} color={colors.steel} />
          </TouchableOpacity>
        ))}
      </View>
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

    content: { padding: 20, gap: 12 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.onyxRaised,
      padding: 16,
    },
    cardIconBox: {
      width: 44,
      height: 44,
      borderRadius: 13,
      backgroundColor: colors.onyx,
      borderWidth: 1,
      borderColor: colors.hairline,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitle: { color: colors.chrome, fontSize: 15, fontWeight: "700" },
    cardDescription: {
      color: colors.steel,
      fontSize: 12.5,
      marginTop: 3,
      lineHeight: 17,
    },
  });
