import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import {
  Bell,
  BookOpen,
  CalendarCheck,
  CalendarClock,
  ChevronLeft,
  LineChart,
} from "lucide-react-native";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STEPS = [
  {
    icon: BookOpen,
    title: "1. Add your subjects",
    body: "Tap the + button on the attendance screen (or go to Setup → Subjects) and add each subject you're tracking — a name and an optional code.",
  },
  {
    icon: CalendarClock,
    title: "2. Build your weekly timetable (optional)",
    body: "Go to Setup → Weekly Timetable, pick a day, and add a subject to it. Class times are optional — if you want one, tap the start or end field and pick it on the clock. Timetable classes show up under \"Today's classes\" on the days they repeat.",
  },
  {
    icon: Bell,
    title: "3. Turn on class reminders (optional)",
    body: "Go to Setup → Notifications and turn on reminders. You'll get a notification a few minutes before each class that has a start time. Classes without a time don't get a reminder.",
  },
  {
    icon: CalendarCheck,
    title: "4. Mark attendance",
    body: "Today's timetable classes are on the attendance screen — tap Present, Absent, or Cancelled for each. To mark any other date, open a subject, tap the date on its calendar, and choose a status. A time is optional there too.",
  },
  {
    icon: LineChart,
    title: "5. Track your stats",
    body: "The attendance screen shows your overall and per-subject percentage, updated automatically. Each subject has its own calendar showing every date you've marked — green for present, red for absent.",
  },
];

export default function AttendanceHelpScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.brand}>Help & Guide</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Add your subjects, optionally set up a weekly timetable, and mark
          attendance for any date from each subject&apos;s own calendar.
        </Text>

        {STEPS.map((step) => (
          <View key={step.title} style={styles.card}>
            <View style={styles.cardIconBox}>
              <step.icon size={20} color={colors.chrome} strokeWidth={1.75} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.cardTitle}>{step.title}</Text>
              <Text style={styles.cardBody}>{step.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
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

    content: { padding: 20, paddingBottom: 60 },
    intro: {
      color: colors.silver,
      fontSize: 13.5,
      lineHeight: 20,
      marginBottom: 20,
    },
    card: {
      flexDirection: "row",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.onyxRaised,
      padding: 16,
      marginBottom: 12,
    },
    cardIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.onyx,
      borderWidth: 1,
      borderColor: colors.hairline,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitle: { color: colors.chrome, fontSize: 14.5, fontWeight: "700", marginBottom: 6 },
    cardBody: { color: colors.steel, fontSize: 12.5, lineHeight: 18 },
  });
