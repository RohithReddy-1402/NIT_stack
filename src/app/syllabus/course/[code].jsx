import DownloadOptionsSheet from "@/components/DownloadOptionsSheet";
import Footer from "@/components/Footer";
import { useToast } from "@/contexts/ToastContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  saveGeneratedFileToDevice,
  saveGeneratedFileToLibrary,
} from "@/services/downloads";
import * as Print from "expo-print";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { ChevronLeft, Download, ExternalLink } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const OFFICIAL_SITE_URL = "https://www.nitkkr.ac.in";

/** One label/value row of the course-info table — a bordered row, not a card. */
function InfoRow({ label, value, last, styles }) {
  return (
    <View style={[styles.infoRow, last && styles.rowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

// Mirrors the printed layout of the web syllabus page (test.jsx), which the
// user downloads via window.print() — this builds the same tables/sections
// as HTML so expo-print can render an equivalent PDF on native.
function buildSyllabusHtml(course) {
  const title = course.title;
  const code = course.courseId;
  const ltpc = course.ltpc ?? [];
  const rows = (items = []) =>
    items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  const unitsHtml = (course.syllabus ?? [])
    .map(
      (u) => `
        <h3 class="unit">Unit - ${escapeHtml(u.id)}</h3>
        <h4>${escapeHtml(u.title)}</h4>
        <p>${escapeHtml(u.body)} <span class="nowrap">(${escapeHtml(u.hours)} hrs)</span></p>
        ${
          u.subsection
            ? `<h4>${escapeHtml(u.subsection.title)}</h4>
               <p>${escapeHtml(u.subsection.body)} <span class="nowrap">(${escapeHtml(u.subsection.hours)} hrs)</span></p>`
            : ""
        }
      `,
    )
    .join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: Georgia, serif; color: #000; padding: 24px; }
  h2.section { margin-top: 28px; font-size: 18px; text-transform: uppercase; letter-spacing: 0.05em; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  td, th { border: 1px solid #000; padding: 8px 10px; font-size: 14px; }
  td.label { font-weight: bold; width: 50%; }
  th { text-align: center; }
  p { line-height: 1.5; text-align: justify; font-size: 14px; }
  .nowrap { white-space: nowrap; }
  ol { padding-left: 22px; }
  li { margin-bottom: 6px; font-size: 14px; }
</style>
</head>
<body>
  <table>
    <tr><td class="label">Course Code</td><td>${escapeHtml(code)}</td></tr>
    <tr><td class="label">Course Title</td><td>${escapeHtml(title)}</td></tr>
    <tr><td class="label">Number of Credits</td><td>${escapeHtml(course.credits)}</td></tr>
    <tr><td class="label">Prerequisites</td><td>${escapeHtml(course.prerequisites ?? "-")}</td></tr>
    <tr><td class="label">Course Type</td><td>${escapeHtml(course.courseType)}</td></tr>
  </table>

  <table>
    <thead>
      <tr><th>L</th><th>T</th><th>P</th><th>Credits</th><th>Total contact hours</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>${escapeHtml(ltpc[0])}</td>
        <td>${escapeHtml(ltpc[1])}</td>
        <td>${escapeHtml(ltpc[2])}</td>
        <td>${escapeHtml(ltpc[3])}</td>
        <td>${escapeHtml(course.contactHours)}</td>
      </tr>
    </tbody>
  </table>

  <h2 class="section">Brief Description about the course</h2>
  <p>${escapeHtml(course.description)}</p>

  ${unitsHtml}

  ${
    course.experiments?.length
      ? `<h2 class="section">List of Experiments</h2><ol>${rows(course.experiments)}</ol>`
      : ""
  }

  <h2 class="section">Course Outcomes</h2>
  <p>Upon successful completion of the course, students will:</p>
  <ol>${rows(course.outcomes)}</ol>

  ${
    course.textbooks?.length
      ? `<h2 class="section">Text Books</h2><ol>${rows(course.textbooks)}</ol>`
      : ""
  }

  ${
    course.referenceBooks?.length
      ? `<h2 class="section">Reference Books</h2><ol>${rows(course.referenceBooks)}</ol>`
      : ""
  }
</body>
</html>`;
}

// Full syllabus content now lives in the backend (see back/models/syllabus.model.js
// and back/scripts/migrateSyllabus.js) rather than being bundled in the app,
// so every course's data — catalog fields and, where written up, the full
// unit-by-unit content — comes from this one fetch.
function useRemoteCourse(code) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/syllabus`,
        );
        const result = await response.json();
        const list = Array.isArray(result) ? result : (result.data ?? []);
        const match = list.find(
          (item) => item.courseId?.toLowerCase() === code.toLowerCase(),
        );
        if (!cancelled) setCourse(match ?? null);
      } catch (error) {
        console.error("Failed to load course from backend:", error);
        if (!cancelled) setCourse(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  return { course, loading };
}

export default function CourseSyllabusScreen() {
  const { code } = useLocalSearchParams();
  const codeStr = String(code).toLowerCase();
  const { course, loading } = useRemoteCourse(codeStr);
  const { addToast } = useToast();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [downloadSheetOpen, setDownloadSheetOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const generatePdf = async () => {
    const { uri } = await Print.printToFileAsync({
      html: buildSyllabusHtml(course),
    });
    return uri;
  };

  const handleSaveInApp = async () => {
    setDownloading(true);
    try {
      const uri = await generatePdf();
      await saveGeneratedFileToLibrary({
        id: course.id,
        title: course.title,
        code: course.courseId,
        source: "syllabus",
        localUri: uri,
      });
      addToast(
        `${course.title} saved to your library.`,
        "success",
      );
    } catch {
      addToast("Couldn't save that syllabus. Try again.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveToDevice = async () => {
    setDownloading(true);
    try {
      const uri = await generatePdf();
      const filename = `${course.courseId}-syllabus.pdf`.replace(
        /[^a-zA-Z0-9-_.]/g,
        "_",
      );

      if (Platform.OS === "android") {
        const { savedDirectly } = await saveGeneratedFileToDevice(uri, filename);
        if (savedDirectly) {
          addToast(
            `${course.title} saved to your device.`,
            "success",
          );
          return;
        }
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch {
      addToast("Couldn't download that syllabus. Try again.", "error");
    } finally {
      setDownloading(false);
    }
  };

  if (loading && !course) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.brand}>Syllabus</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.brand}>Syllabus</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Course not found</Text>
          <Text style={styles.emptySubtitle}>
            We don&apos;t have syllabus content for this course yet.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Courses without a written-up unit-by-unit syllabus yet (still possible
  // for newly added catalog entries) fall through to the lighter sections
  // below, which are already each guarded by their own `?.length > 0` check.
  const {
    title,
    courseId: courseCode,
    credits,
    prerequisites,
    courseType,
    branches,
    ltpc,
    contactHours,
    description,
    syllabus: units,
    outcomes,
    textbooks,
    referenceBooks,
    experiments,
  } = course;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.brand} numberOfLines={1}>
          {courseCode}
        </Text>
        <TouchableOpacity
          style={styles.backBtn}
          disabled={downloading}
          onPress={() => setDownloadSheetOpen(true)}
        >
          {downloading ? (
            <ActivityIndicator size="small" color={colors.chrome} />
          ) : (
            <Download size={20} color={colors.chrome} strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {courseCode} · {branches?.join(", ")}
        </Text>

        <TouchableOpacity
          style={styles.sourceRow}
          activeOpacity={0.7}
          onPress={() => Linking.openURL(OFFICIAL_SITE_URL)}
        >
          <ExternalLink size={13} color={colors.accent} strokeWidth={2} />
          <Text style={styles.sourceText}>
            Source: official NIT Kurukshetra curriculum · nitkkr.ac.in
          </Text>
        </TouchableOpacity>

        {/* Course info + L-T-P-C, laid out as bordered rows/columns like the
            official printed syllabus (web) rather than scattered cards. */}
        <View style={styles.infoTable}>
          <InfoRow styles={styles} label="Course Code" value={courseCode} />
          <InfoRow styles={styles} label="Course Title" value={title} />
          <InfoRow styles={styles} label="Number of Credits" value={credits} />
          <InfoRow
            styles={styles}
            label="Prerequisites"
            value={!prerequisites || prerequisites === "None" ? "-" : prerequisites}
          />
          <InfoRow styles={styles} label="Course Type" value={courseType} last={!ltpc?.length} />
        </View>

        {ltpc?.length === 4 && (
          <View style={[styles.infoTable, { marginTop: 10 }]}>
            <View style={styles.ltpcHeaderRow}>
              {["L", "T", "P", "Credits", "Hours"].map((h, i) => (
                <Text key={h} style={[styles.ltpcHeaderCell, i === 4 && styles.ltpcCellLast]}>{h}</Text>
              ))}
            </View>
            <View style={[styles.ltpcRow, styles.rowLast]}>
              {[...ltpc, contactHours].map((v, i) => (
                <Text key={i} style={[styles.ltpcCell, i === 4 && styles.ltpcCellLast]}>{v}</Text>
              ))}
            </View>
          </View>
        )}

        {description && (
          <>
            <Text style={styles.sectionHeading}>Brief Description About the Course</Text>
            <Text style={styles.paragraph}>{description}</Text>
          </>
        )}

        {units?.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Unit-by-Unit Breakdown</Text>
            {units.map((unit) => (
              <View key={unit.id} style={styles.unitBlock}>
                <Text style={styles.unitEyebrow}>Unit - {unit.id}</Text>
                <Text style={styles.unitTitle}>{unit.title}</Text>
                <Text style={styles.unitBody}>
                  {unit.body}
                  {unit.hours != null ? <Text style={styles.nowrap}> ({unit.hours} hrs)</Text> : null}
                </Text>
                {unit.subsection && (
                  <>
                    <Text style={[styles.unitTitle, styles.subsectionTitle]}>{unit.subsection.title}</Text>
                    <Text style={styles.unitBody}>
                      {unit.subsection.body}
                      {unit.subsection.hours != null ? (
                        <Text style={styles.nowrap}> ({unit.subsection.hours} hrs)</Text>
                      ) : null}
                    </Text>
                  </>
                )}
              </View>
            ))}
          </>
        )}

        {experiments?.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>List of Experiments</Text>
            {experiments.map((experiment, i) => (
              <View key={i} style={styles.listRow}>
                <Text style={styles.listBullet}>{i + 1}.</Text>
                <Text style={styles.listText}>{experiment}</Text>
              </View>
            ))}
          </>
        )}

        {outcomes?.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Course Outcomes</Text>
            <Text style={styles.paragraph}>Upon successful completion of the course, students will:</Text>
            {outcomes.map((outcome, i) => (
              <View key={i} style={styles.listRow}>
                <Text style={styles.listBullet}>{i + 1}.</Text>
                <Text style={styles.listText}>{outcome}</Text>
              </View>
            ))}
          </>
        )}

        {textbooks?.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Text Books</Text>
            {textbooks.map((book, i) => (
              <View key={i} style={styles.listRow}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>{book}</Text>
              </View>
            ))}
          </>
        )}

        {referenceBooks?.length > 0 && (
          <>
            <Text style={styles.sectionHeading}>Reference Books</Text>
            {referenceBooks.map((book, i) => (
              <View key={i} style={styles.listRow}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>{book}</Text>
              </View>
            ))}
          </>
        )}

        <Footer />
      </ScrollView>

      <DownloadOptionsSheet
        visible={downloadSheetOpen}
        title={title}
        subtitle={courseCode}
        onClose={() => setDownloadSheetOpen(false)}
        onSaveInApp={handleSaveInApp}
        onSaveToDevice={handleSaveToDevice}
      />
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
  brand: { color: colors.chrome, fontSize: 15, fontWeight: "700", flex: 1, textAlign: "center" },

  content: { paddingHorizontal: 20, paddingTop: 24 },
  title: { color: colors.chrome, fontSize: 22, fontWeight: "800", lineHeight: 28 },
  subtitle: { color: colors.steel, fontSize: 13, fontWeight: "600", marginTop: 6, marginBottom: 14 },

  sourceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  sourceText: { color: colors.accent, fontSize: 12, fontWeight: "600", textDecorationLine: "underline" },

  // Bordered info table, mirroring the web syllabus page's label/value rows
  // instead of a grid of rounded stat cards.
  infoTable: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowLast: { borderBottomWidth: 0 },
  infoLabel: {
    flex: 1,
    color: colors.silver,
    fontSize: 13,
    fontWeight: "700",
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: colors.hairline,
    backgroundColor: colors.onyxRaised,
  },
  infoValue: { flex: 1, color: colors.chrome, fontSize: 13, padding: 10 },

  ltpcHeaderRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.hairline },
  ltpcHeaderCell: {
    flex: 1,
    color: colors.silver,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: colors.hairline,
    backgroundColor: colors.onyxRaised,
  },
  ltpcRow: { flexDirection: "row" },
  ltpcCell: {
    flex: 1,
    color: colors.chrome,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: colors.hairline,
  },
  ltpcCellLast: { borderRightWidth: 0 },

  sectionHeading: {
    color: colors.chrome,
    fontSize: 15,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 24,
    marginBottom: 10,
  },
  paragraph: { color: colors.silver, fontSize: 14.5, lineHeight: 22, marginBottom: 12, textAlign: "justify" },
  nowrap: { color: colors.steel },

  // Units read as a running document (eyebrow label, title, justified body)
  // rather than individual cards, matching the web page's typographic flow.
  unitBlock: { marginBottom: 18 },
  unitEyebrow: { color: colors.steel, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  unitTitle: { color: colors.chrome, fontSize: 16, fontWeight: "800", marginTop: 2, marginBottom: 6 },
  unitBody: { color: colors.silver, fontSize: 14, lineHeight: 21, textAlign: "justify" },
  subsectionTitle: { marginTop: 12 },

  listRow: { flexDirection: "row", gap: 8, marginBottom: 10, paddingRight: 4 },
  listBullet: { color: colors.accent, fontSize: 13.5, fontWeight: "700", width: 18 },
  listText: { color: colors.silver, fontSize: 13.5, lineHeight: 20, flex: 1 },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30 },
  emptyTitle: { color: colors.chrome, fontSize: 16, fontWeight: "700" },
  emptySubtitle: { color: colors.steel, fontSize: 13, textAlign: "center", marginTop: 8, lineHeight: 18 },
});
