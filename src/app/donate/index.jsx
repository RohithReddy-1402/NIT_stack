import Footer from "@/components/Footer";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ChevronDown,
  ChevronLeft,
  Heart,
  IndianRupee,
  ShieldCheck,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRESETS = [50, 100, 250, 500, 1000];

const ALLOCATION = [
  { label: "Server & hosting", pct: 40 },
  { label: "Database", pct: 20 },
  { label: "Storage", pct: 15 },
  { label: "Development", pct: 10 },
  { label: "Domain & security", pct: 10 },
  { label: "Miscellaneous", pct: 5 },
];

const FAQ = [
  {
    q: "Why donate if the app is free?",
    a: "The app will always be free to use. Donations are entirely optional and simply help cover the running costs — hosting, storage, and domain renewal — so the archive can keep growing.",
  },
  {
    q: "Will the app remain free?",
    a: "Yes. Every paper, syllabus, and resource stays free whether you donate or not. Donating never unlocks anything that wasn't already available to everyone.",
  },
  {
    q: "Is payment secure?",
    a: "Yes. Payments are processed through Razorpay, a widely used and secure payment gateway. Card and bank details are handled directly by Razorpay, not stored by this app.",
  },
  {
    q: "Where does the money go?",
    a: "Mainly toward server and database hosting, storage for papers, the domain, and small development costs — the breakdown above shows an approximate split.",
  },
];

export default function DonateScreen() {
  const { addToast } = useToast();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [selected, setSelected] = useState(250);
  const [custom, setCustom] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const activeAmount = useCustom ? Number(custom) || 0 : selected;

  const handleDonate = () => {
    if (!activeAmount) return;
    addToast(
      `Thank you for your support! Razorpay checkout for ₹${activeAmount} isn't wired up yet.`,
      "info",
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.brand}>Donate</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heroEyebrow}>NITKKRPYQS.IN</Text>
        <Text style={styles.heroTitle}>Support NIT KKR PYQs</Text>
        <Text style={styles.heroBody}>
          NIT KKR Previous Papers is run for students, by a student. It stays
          free for everyone, always. If it has saved you a late night
          searching for a paper, a donation helps with maintenance and growth
          of the platform.
        </Text>

        {/* Donation ticket */}
        <LinearGradient
          colors={[colors.onyxRaised, colors.onyx]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ticket}
        >
          <Text style={styles.ticketLabel}>CHOOSE AN AMOUNT</Text>
          <View style={styles.amountGrid}>
            {PRESETS.map((amt) => {
              const active = !useCustom && selected === amt;
              return (
                <TouchableOpacity
                  key={amt}
                  onPress={() => {
                    setSelected(amt);
                    setUseCustom(false);
                  }}
                  style={[styles.amountChip, active && styles.amountChipActive]}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.amountChipText,
                      active && styles.amountChipTextActive,
                    ]}
                  >
                    ₹{amt}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              onPress={() => setUseCustom(true)}
              style={[styles.amountChip, useCustom && styles.amountChipActive]}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.amountChipText,
                  useCustom && styles.amountChipTextActive,
                ]}
              >
                Custom
              </Text>
            </TouchableOpacity>
          </View>

          {useCustom && (
            <View style={styles.customRow}>
              <IndianRupee size={16} color={colors.steel} />
              <TextInput
                value={custom}
                onChangeText={setCustom}
                placeholder="Enter amount"
                placeholderTextColor={colors.steel}
                keyboardType="numeric"
                style={styles.customInput}
              />
            </View>
          )}

          <View style={styles.perforation} />

          <TouchableOpacity
            style={styles.donateBtn}
            activeOpacity={0.85}
            onPress={handleDonate}
            disabled={!activeAmount}
          >
            <Heart size={16} color={colors.void} strokeWidth={2} />
            <Text style={styles.donateBtnText}>Donate ₹{activeAmount || 0}</Text>
          </TouchableOpacity>

          <View style={styles.secureRow}>
            <ShieldCheck size={13} color={colors.steel} />
            <Text style={styles.secureText}>SECURED BY RAZORPAY</Text>
          </View>
        </LinearGradient>

        {/* Allocation */}
        <Text style={styles.heading}>Where your donation goes</Text>
        <Text style={styles.paragraph}>
          These are approximate allocations, not fixed commitments — costs
          shift month to month as the archive grows.
        </Text>
        <View style={styles.allocationCard}>
          {ALLOCATION.map((item) => (
            <View key={item.label} style={styles.allocationRow}>
              <View style={styles.allocationHeaderRow}>
                <Text style={styles.allocationLabel}>{item.label}</Text>
                <Text style={styles.allocationPct}>{item.pct}%</Text>
              </View>
              <View style={styles.allocationBarTrack}>
                <View
                  style={[styles.allocationBarFill, { width: `${item.pct}%` }]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Developer note */}
        <Text style={styles.heading}>A note from the developer</Text>
        <View style={styles.noteCard}>
          <Text style={styles.noteQuote}>
            &ldquo;I built this because I remember what it was like to hunt for a
            previous year&apos;s paper the night before an exam — scattered PDFs,
            dead links, and seniors who&apos;d already left the group.&rdquo;
          </Text>
          <Text style={styles.noteBody}>
            NIT KKR Previous Papers started as a small folder of scanned
            papers I&apos;d collected for my own semester exams. Hosting, storage,
            and a domain all cost something to keep running. Donations don&apos;t
            fund a business — they fund the next semester of uptime. If this
            app has helped you and you&apos;re able to spare something, it
            genuinely helps. If not, that&apos;s completely fine too — use it,
            share it with your batchmates, and good luck with your exams.
          </Text>
          <Text style={styles.noteSign}>— The developer, NIT KKR Previous Papers</Text>
        </View>

        {/* FAQ */}
        <Text style={styles.heading}>Common questions</Text>
        <View style={styles.faqCard}>
          {FAQ.map((item, i) => {
            const isOpen = openFaq === i;
            return (
              <View
                key={item.q}
                style={[styles.faqRow, i !== 0 && styles.faqRowBorder]}
              >
                <TouchableOpacity
                  style={styles.faqQuestionRow}
                  activeOpacity={0.7}
                  onPress={() => setOpenFaq(isOpen ? -1 : i)}
                >
                  <Text style={styles.faqQuestion}>{item.q}</Text>
                  <ChevronDown
                    size={16}
                    color={colors.accent}
                    style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}
                  />
                </TouchableOpacity>
                {isOpen && <Text style={styles.faqAnswer}>{item.a}</Text>}
              </View>
            );
          })}
        </View>

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
  heroEyebrow: { color: colors.accent, fontSize: 11, fontWeight: "700", letterSpacing: 2, marginBottom: 8 },
  heroTitle: { color: colors.chrome, fontSize: 28, fontWeight: "800", marginBottom: 10 },
  heroBody: { color: colors.silver, fontSize: 14.5, lineHeight: 22, marginBottom: 26 },

  ticket: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 20,
    marginBottom: 30,
  },
  ticketLabel: { color: colors.steel, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 12 },
  amountGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  amountChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.onyx,
  },
  amountChipActive: { backgroundColor: colors.chrome, borderColor: colors.chrome },
  amountChipText: { color: colors.silver, fontSize: 13.5, fontWeight: "600" },
  amountChipTextActive: { color: colors.void, fontWeight: "700" },

  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.onyx,
  },
  customInput: { flex: 1, color: colors.chrome, fontSize: 14, height: 44 },

  perforation: {
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.hairline,
    marginVertical: 18,
  },
  donateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.chrome,
    borderRadius: 12,
    paddingVertical: 14,
  },
  donateBtnText: { color: colors.void, fontSize: 15, fontWeight: "700" },
  secureRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 },
  secureText: { color: colors.steel, fontSize: 10, letterSpacing: 1, fontWeight: "600" },

  heading: { color: colors.chrome, fontSize: 18, fontWeight: "700", marginTop: 4, marginBottom: 8 },
  paragraph: { color: colors.silver, fontSize: 13.5, lineHeight: 20, marginBottom: 16 },

  allocationCard: {
    backgroundColor: colors.onyxRaised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 18,
    marginBottom: 26,
    gap: 16,
  },
  allocationRow: {},
  allocationHeaderRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  allocationLabel: { color: colors.silver, fontSize: 13 },
  allocationPct: { color: colors.chrome, fontSize: 13, fontWeight: "700" },
  allocationBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.hairline,
    overflow: "hidden",
  },
  allocationBarFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 3 },

  noteCard: {
    backgroundColor: colors.onyxRaised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 20,
    marginBottom: 26,
  },
  noteQuote: { color: colors.chrome, fontSize: 15, fontStyle: "italic", lineHeight: 22, marginBottom: 14 },
  noteBody: { color: colors.silver, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  noteSign: { color: colors.steel, fontSize: 12.5, fontWeight: "600" },

  faqCard: {
    backgroundColor: colors.onyxRaised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: "hidden",
    marginBottom: 12,
  },
  faqRow: { paddingHorizontal: 18, paddingVertical: 4 },
  faqRowBorder: { borderTopWidth: 1, borderTopColor: colors.hairline },
  faqQuestionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
  faqQuestion: { color: colors.chrome, fontSize: 13.5, fontWeight: "600", flex: 1, marginRight: 10 },
  faqAnswer: { color: colors.steel, fontSize: 12.5, lineHeight: 19, paddingBottom: 16 },
  });
