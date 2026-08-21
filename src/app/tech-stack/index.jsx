import Footer from "@/components/Footer";
import { router } from "expo-router";
import {
  ChevronLeft,
  Cloud,
  Code2,
  CreditCard,
  Database,
  LineChart,
  Mail,
  Server,
  ShieldCheck,
} from "lucide-react-native";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const colors = {
  void: "#0A0A0B",
  onyxRaised: "#1C1C1F",
  onyx: "#141416",
  chrome: "#F5F5F7",
  silver: "#C9C9CE",
  steel: "#8E8E93",
  hairline: "#2C2C30",
  accent: "#8E8EFF",
};

const STACK = [
  {
    icon: Code2,
    title: "Frontend",
    body: "This app is built with React Native and Expo Router, styled to match a consistent, glossy dark theme across every screen. Navigation between screens, such as Home, Question Papers, Syllabus and static pages, is handled by Expo Router's file-based routing.",
  },
  {
    icon: Server,
    title: "Backend",
    body: "The API that serves question papers, syllabus data and user accounts is a Node.js server built with Express, handling everything from search and downloads to authentication sessions.",
  },
  {
    icon: Database,
    title: "Database",
    body: "All structured data, including paper metadata, download counts and user accounts, is stored in MongoDB, which fits well with how flexible our question paper and syllabus records need to be as the collection grows.",
  },
  {
    icon: ShieldCheck,
    title: "Authentication",
    body: "You can sign in either with Google Sign-In or with a manually created email and password account, so you are not forced into any single login method to contribute papers or access your account.",
  },
  {
    icon: Mail,
    title: "Email",
    body: "Account emails, such as verification and password-reset messages for manual sign-ups, are delivered through Resend, a reliable transactional email service.",
  },
  {
    icon: Database,
    title: "File Storage",
    body: "Every question paper you download is stored using Cloudflare R2, an S3-compatible object storage service. This keeps downloads fast and reliable, and lets us keep adding papers each semester without slowing the app down.",
  },
  {
    icon: CreditCard,
    title: "Payments",
    body: "Donations to support hosting and running costs are processed through Razorpay, a widely used and trusted payment gateway in India. We never see or store your card, UPI, or banking details; that information stays with Razorpay.",
  },
  {
    icon: LineChart,
    title: "Analytics",
    body: "We track basic, aggregated usage in a privacy-friendly way to understand which pages and papers are most useful to students, so we know where to focus improvements next.",
  },
  {
    icon: Cloud,
    title: "Hosting & Deployment",
    body: "The backend API is deployed with automatic deployments whenever we ship an update, so new papers and fixes go live quickly.",
  },
];

export default function TechStackScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.brand}>Tech Stack</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.paragraph}>
          A student from a coding background, so we get asked fairly often
          what this app is actually built with. Here is a quick, honest
          breakdown of the tools and services that keep NIT KKR PYQs running,
          from the screen you are looking at right now to the file that
          downloads when you tap a paper.
        </Text>

        <View style={styles.cardsWrap}>
          {STACK.map(({ icon: Icon, title, body }) => (
            <View key={title} style={styles.card}>
              <View style={styles.iconRing}>
                <Icon size={20} color={colors.accent} strokeWidth={1.75} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.cardBody}>{body}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.heading}>Why This Stack</Text>
        <Text style={styles.paragraph}>
          We picked tools that let a small, mostly student team ship features
          quickly without needing to manage a lot of infrastructure. React
          Native and Expo give us a fast, modern app across platforms, backed
          by a straightforward Express API and a MongoDB database that flexes
          easily as we add new branches and semesters. Cloudflare R2 keeps
          file storage costs low while serving downloads quickly, and Resend
          handles account emails reliably.
        </Text>
        <Text style={styles.paragraph}>
          If you are a student who is curious about how this was built, or
          you would like to contribute to the project, feel free to reach out
          through our{" "}
          <Text style={styles.link} onPress={() => router.push("contact")}>
            Contact page
          </Text>
          .
        </Text>

        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.void },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  brand: { color: colors.chrome, fontSize: 17, fontWeight: "700" },

  content: { paddingHorizontal: 20, paddingTop: 24 },
  paragraph: { color: colors.silver, fontSize: 14.5, lineHeight: 22, marginBottom: 18 },
  heading: { color: colors.chrome, fontSize: 18, fontWeight: "700", marginTop: 6, marginBottom: 10 },
  link: { color: colors.accent, fontWeight: "700" },

  cardsWrap: { gap: 12, marginBottom: 8 },
  card: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: colors.onyxRaised,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 16,
  },
  iconRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.onyx,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { color: colors.chrome, fontSize: 14.5, fontWeight: "700", marginBottom: 4 },
  cardBody: { color: colors.steel, fontSize: 12.5, lineHeight: 18 },
});
