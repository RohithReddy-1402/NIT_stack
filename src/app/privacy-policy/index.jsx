import Footer from "@/components/Footer";
import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: [
      "We collect a limited amount of information, only what is needed to run the service:",
      "Account information: if you sign in with Google or create an account, we receive your name, email address and profile picture from the authentication provider so we can identify your account.",
      "Contributed content: if you upload a question paper through our Contribute feature, we store the file along with the subject, semester and year details you provide, so it can be reviewed and shared with other students.",
      "Contact and support requests: if you reach out through our Contact page, we store the message and any contact details you choose to share so we can respond.",
      "Usage data: we automatically collect basic, non-identifying usage data such as pages visited and download counts, to understand how the app is used and to improve it.",
      "Donation information: if you choose to donate, payments are processed directly by Razorpay. We do not receive or store your card, UPI or bank details on our servers.",
    ],
  },
  {
    title: "2. How We Use Information",
    body: [
      "We use the information above to operate and maintain the app, to let you sign in and contribute papers, to review and publish contributed content, to respond to support requests, to keep basic usage statistics, and to keep the platform secure and free of abuse. We do not sell your personal information to third parties.",
    ],
  },
  {
    title: "3. Cookies and Third-Party Services",
    body: [
      "This app relies on the following third-party services, each governed by its own privacy policy:",
      "Google Sign-In: used to let you log in securely using your Google account.",
      "Razorpay: used to securely process donation payments.",
      "Cloudflare: used to store and deliver question paper files.",
    ],
  },
  {
    title: "4. Data Sharing",
    body: [
      "We do not share your personal information with third parties except with the service providers listed above (strictly to operate the app), or when required to comply with the law, protect our rights, or prevent fraud or abuse of the platform.",
    ],
  },
  {
    title: "5. Data Security",
    body: [
      "We take reasonable technical measures, such as encrypted connections (HTTPS) and access-controlled storage, to protect the information we hold. However, no method of transmission or storage over the internet is completely secure, and we cannot guarantee absolute security.",
    ],
  },
  {
    title: "6. Your Choices",
    body: [
      "You can use most of this app, including browsing and downloading question papers and syllabus content, without creating an account. If you have an account and would like your data corrected or deleted, or if you would like a contributed paper removed, you can reach out to us through the Contact page and we will act on your request.",
    ],
  },
  {
    title: "7. Children's Privacy",
    body: [
      "This app is intended for college students and is not directed at children under 13. We do not knowingly collect personal information from children under 13.",
    ],
  },
  {
    title: "8. Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time to reflect changes in our practices or for legal reasons. Any changes will be posted on this page with an updated \"Last updated\" date.",
    ],
  },
  {
    title: "9. Contact Us",
    body: [
      "If you have any questions about this Privacy Policy, please get in touch through our Contact page.",
    ],
  },
];

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.brand}>Privacy Policy</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Last updated: August 19, 2026</Text>
        <Text style={styles.paragraph}>
          NIT KKR PYQs (also referred to as &quot;NexSphere&quot;, &quot;we&quot;, &quot;us&quot; or &quot;our&quot;)
          is a student-run platform that helps students of NIT Kurukshetra
          find previous year question papers, syllabus information and
          related academic resources. This Privacy Policy explains what
          information we collect when you use this app, how we use it, and
          the choices you have. By using this app you agree to the collection
          and use of information described here.
        </Text>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.heading}>{section.title}</Text>
            {section.body.map((line, i) => (
              <Text key={i} style={styles.paragraph}>
                {line}
              </Text>
            ))}
          </View>
        ))}

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
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  brand: { color: colors.chrome, fontSize: 17, fontWeight: "700" },

  content: { paddingHorizontal: 20, paddingTop: 24 },
  updated: { color: colors.steel, fontSize: 12, marginBottom: 16 },
  section: { marginBottom: 6 },
  heading: {
    color: colors.chrome,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 8,
  },
  paragraph: {
    color: colors.silver,
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 10,
  },
  });
