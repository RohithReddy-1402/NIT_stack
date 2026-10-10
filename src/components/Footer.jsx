import { router } from "expo-router";
import { ExternalLink, Globe, Mail, MapPin } from "lucide-react-native";
import { useMemo } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";

const OFFICIAL_SITE_URL = "https://www.nitkkr.ac.in";

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
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

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

      <Text style={styles.sectionLabel}>Disclaimer</Text>
      <Text style={styles.disclaimerText}>
        This application is not affiliated with, endorsed by, sponsored by,
        or officially connected with NIT Kurukshetra or any Government of
        India / State Government department.
      </Text>
      <Text style={[styles.disclaimerText, { marginTop: 8 }]}>
        The syllabus, curriculum and course information shown here is
        compiled from the official NIT Kurukshetra website for informational
        purposes only. Please verify against the official source below
        before relying on it.
      </Text>

      <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
        Official Source
      </Text>
      <TouchableOpacity
        style={styles.reachRow}
        activeOpacity={0.7}
        onPress={() => Linking.openURL(OFFICIAL_SITE_URL)}
      >
        <ExternalLink size={15} color={colors.accent} strokeWidth={1.75} />
        <Text style={[styles.reachText, styles.sourceLink]}>
          NIT Kurukshetra official website — nitkkr.ac.in
        </Text>
      </TouchableOpacity>

      <View style={styles.hr} />
      <Text style={styles.copy}>
        © {new Date().getFullYear()} NIT KKR PYQs. Built by students, for
        students.
      </Text>
      <Text style={styles.copy}>Not officially affiliated with NIT Kurukshetra.</Text>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
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
  sourceLink: { color: colors.accent, textDecorationLine: "underline" },
  disclaimerText: { color: colors.steel, fontSize: 12, lineHeight: 18 },

  hr: { height: 1, backgroundColor: colors.hairline, marginTop: 10, marginBottom: 14 },
  copy: { color: colors.steel, fontSize: 11, marginBottom: 4 },
});
