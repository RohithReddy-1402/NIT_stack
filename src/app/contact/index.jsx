import Footer from "@/components/Footer";
import { useToast } from "@/contexts/ToastContext";
import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import { CheckCircle2, ChevronLeft, Send } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ContactScreen() {
  const { addToast } = useToast();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      addToast("Please fill in your name, email and message.", "error");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        addToast("Failed to send message. Please try again later.", "error");
      }
    } catch {
      addToast("Something went wrong sending your message.", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.brand}>Contact</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Get in touch</Text>
          <Text style={styles.paragraph}>
            Questions, feedback, or help contributing question papers and
            syllabus resources — we would love to hear from you.
          </Text>

          {sent ? (
            <View style={styles.sentCard}>
              <CheckCircle2 size={40} color={colors.accent} strokeWidth={1.75} />
              <Text style={styles.sentTitle}>Message Sent</Text>
              <Text style={styles.sentBody}>
                We&apos;ll respond to {email} within 24 hours.
              </Text>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="John Doe"
                placeholderTextColor={colors.steel}
                style={styles.input}
              />

              <Text style={styles.label}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.steel}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />

              <Text style={styles.label}>Subject</Text>
              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="What's this about?"
                placeholderTextColor={colors.steel}
                style={styles.input}
              />

              <Text style={styles.label}>Message</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Hello, I wanted to..."
                placeholderTextColor={colors.steel}
                multiline
                numberOfLines={5}
                style={[styles.input, styles.textarea]}
              />

              <TouchableOpacity
                style={[styles.submitBtn, sending && styles.submitBtnDisabled]}
                activeOpacity={0.85}
                onPress={handleSubmit}
                disabled={sending}
              >
                <Send size={16} color={colors.void} strokeWidth={2} />
                <Text style={styles.submitText}>
                  {sending ? "Sending..." : "Send Message"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Footer />
        </ScrollView>
      </KeyboardAvoidingView>
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
  heading: { color: colors.chrome, fontSize: 24, fontWeight: "800", marginBottom: 10 },
  paragraph: { color: colors.silver, fontSize: 14, lineHeight: 21, marginBottom: 26 },

  form: {},
  label: { color: colors.silver, fontSize: 12.5, fontWeight: "600", marginBottom: 8 },
  input: {
    backgroundColor: colors.onyxRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    color: colors.chrome,
    fontSize: 14,
    marginBottom: 16,
  },
  textarea: { height: 120, paddingTop: 12, textAlignVertical: "top" },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.chrome,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 6,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: colors.void, fontSize: 14.5, fontWeight: "700" },

  sentCard: {
    alignItems: "center",
    backgroundColor: colors.onyxRaised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  sentTitle: { color: colors.chrome, fontSize: 16, fontWeight: "700", marginTop: 14, marginBottom: 6 },
  sentBody: { color: colors.steel, fontSize: 13, textAlign: "center" },
  });
