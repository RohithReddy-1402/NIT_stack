import { router } from "expo-router";
import { Globe, Mail, MapPin } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const colors = {
  void: "#0A0A0B",
  onyx: "#141416",
  chrome: "#F5F5F7",
  silver: "#C9C9CE",
  steel: "#8E8E93",
  hairline: "#2C2C30",
  accent: "#8E8EFF",
};

const LINKS = [
  { label: "Home", route: "/" },
  { label: "About Us", route: "about" },
  { label: "Question Papers", route: "papers" },
  { label: "Syllabus", route: "syllabus" },
  { label: "Tech Stack", route: "tech-stack" },
  { label: "Donate", route: "donate" },
  { label: "Contact", route: "contact" },
  { label: "Privacy Policy", route: "privacy-policy" },
];

export default function Footer() {
  return (
    <View style={styles.wrap}>
      <View style={styles.brandRow}>
        <Text style={styles.brandTitle}>NIT KKR PYQs</Text>
        <Text style={styles.brandSub}>NEXSPHERE</Text>
      </View>
      <Text style={styles.brandBody}>
        A free, student-run platform helping NIT Kurukshetra students find
        previous year question papers and syllabus resources, organized by
        branch, semester and year.
      </Text>

      <Text style={styles.sectionLabel}>Quick Links</Text>
      <View style={styles.linksWrap}>
        {LINKS.map((link) => (
          <TouchableOpacity
            key={link.label}
            onPress={() => router.push(link.route)}
            activeOpacity={0.7}
            style={styles.linkRow}
          >
            <Text style={styles.linkText}>{link.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Reach Us</Text>
      <View style={styles.reachRow}>
        <MapPin size={15} color={colors.accent} strokeWidth={1.75} />
        <Text style={styles.reachText}>NIT Kurukshetra, Haryana, India</Text>
      </View>
      <TouchableOpacity
        style={styles.reachRow}
        activeOpacity={0.7}
        onPress={() => router.push("contact")}
      >
        <Mail size={15} color={colors.accent} strokeWidth={1.75} />
        <Text style={styles.reachText}>Reach us via our Contact page</Text>
      </TouchableOpacity>
      <View style={styles.reachRow}>
        <Globe size={15} color={colors.accent} strokeWidth={1.75} />
        <Text style={styles.reachText}>nitkkrpyqs.in</Text>
      </View>

      <View style={styles.hr} />
      <Text style={styles.copy}>
        © {new Date().getFullYear()} NIT KKR PYQs. Built by students, for
        students.
      </Text>
      <Text style={styles.copy}>Not officially affiliated with NIT Kurukshetra.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.onyx,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    padding: 24,
    marginTop: 32,
  },
  brandRow: { marginBottom: 10 },
  brandTitle: { color: colors.chrome, fontSize: 18, fontWeight: "800" },
  brandSub: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 2,
  },
  brandBody: { color: colors.silver, fontSize: 13, lineHeight: 19, marginBottom: 20 },

  sectionLabel: {
    color: colors.chrome,
    fontSize: 13.5,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 6,
  },
  linksWrap: { marginBottom: 8 },
  linkRow: { paddingVertical: 6 },
  linkText: { color: colors.silver, fontSize: 13 },

  reachRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 10 },
  reachText: { color: colors.silver, fontSize: 13, flexShrink: 1 },

  hr: { height: 1, backgroundColor: colors.hairline, marginTop: 10, marginBottom: 14 },
  copy: { color: colors.steel, fontSize: 11, marginBottom: 4 },
});
