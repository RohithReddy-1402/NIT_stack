import Footer from "@/components/Footer";
import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import { BookOpen, ChevronLeft, Target, Users } from "lucide-react-native";
import { useMemo } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const OFFICIAL_SITE_URL = "https://www.nitkkr.ac.in";

const highlights = [
  {
    icon: BookOpen,
    title: "What We Offer",
    body: "Question papers organized by branch, semester and year, alongside detailed syllabus pages for individual courses.",
  },
  {
    icon: Users,
    title: "Built By Students",
    body: "Maintained by a small team of NIT KKR students who wanted a better way to prepare for exams, and kept improving it after graduating too.",
  },
  {
    icon: Target,
    title: "Our Mission",
    body: "Make exam preparation fairer by giving every student equal, free access to the same past papers and syllabus material.",
  },
];

export default function AboutUsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.brand}>About Us</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.paragraph}>
          NIT KKR PYQs, built under the name NexSphere, is a free, student-run
          platform created to solve a problem every engineering student at NIT
          Kurukshetra runs into sooner or later: finding previous year
          question papers scattered across WhatsApp groups, old Google Drive
          links, and seniors who graduated years ago. We built this app so
          that any student, from any branch and any semester, can search,
          browse and download past papers in one organized place, without
          paying for access or waiting on a reply from someone.
        </Text>

        <View style={styles.cardsWrap}>
          {highlights.map(({ icon: Icon, title, body }) => (
            <View key={title} style={styles.card}>
              <Icon size={26} color={colors.accent} strokeWidth={1.75} />
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardBody}>{body}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.heading}>How It Started</Text>
        <Text style={styles.paragraph}>
          The idea for this platform came from a very ordinary frustration:
          right before exams, students would scramble across multiple
          WhatsApp groups trying to find a Mid-1 or end-semester paper for a
          subject, often getting incomplete sets or blurry scans. We started
          collecting and organizing papers branch-wise and semester-wise, and
          what began as a small shared folder eventually grew into this
          platform, with a proper search, filters by exam type and year, and
          a syllabus section that mirrors the{" "}
          <Text
            style={styles.link}
            onPress={() => Linking.openURL(OFFICIAL_SITE_URL)}
          >
            official course structure published by NIT Kurukshetra
          </Text>
          .
        </Text>

        <Text style={styles.heading}>What Makes This Different</Text>
        <Text style={styles.paragraph}>
          Unlike scattered drive links, every paper here is tagged with its
          subject, subject code, semester, year and exam type, so you can
          search for exactly what you need in seconds. The syllabus pages are
          written out course by course, unit by unit, so you can cross-check
          the exact topics, credit structure and reference books for a
          subject before an exam. We also let students contribute papers they
          have, so the collection keeps growing with each passing semester
          instead of going stale.
        </Text>

        <Text style={styles.heading}>Looking Ahead</Text>
        <Text style={styles.paragraph}>
          We are gradually expanding coverage to more branches, adding more
          semesters of syllabus data, and improving how quickly a contributed
          paper gets verified and published. If you would like to contribute
          papers, report an issue, or just say hello, we would love to hear
          from you on our{" "}
          <Text style={styles.link} onPress={() => router.push("contact")}>
            Contact page
          </Text>
          .
        </Text>

        <Footer />
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
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { color: colors.chrome, fontSize: 17, fontWeight: "700" },

  content: { paddingHorizontal: 20, paddingTop: 24 },
  paragraph: {
    color: colors.silver,
    fontSize: 14.5,
    lineHeight: 22,
    marginBottom: 18,
  },
  heading: {
    color: colors.chrome,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 6,
    marginBottom: 10,
  },
  link: { color: colors.accent, fontWeight: "700" },

  cardsWrap: { gap: 14, marginBottom: 10 },
  card: {
    backgroundColor: colors.onyxRaised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 18,
  },
  cardTitle: {
    color: colors.chrome,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 6,
  },
  cardBody: { color: colors.steel, fontSize: 13, lineHeight: 19 },
  });

