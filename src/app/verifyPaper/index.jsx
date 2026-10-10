import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  Check,
  ChevronLeft,
  Eye,
  FileText,
  Trash2,
  User,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VerifyPaperScreen() {
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [papers, setPapers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") {
      router.replace("/");
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    (async () => {
      try {
        const res = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/verifypapers`,
        );
        const data = await res.json();
        setPapers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching papers:", error);
        addToast("Failed to load pending papers.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (user?.role !== "admin") return null;

  const handleApprove = async (paper) => {
    try {
      await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/verifiedpaper/${paper.r2Key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paper),
        },
      );
      setPapers((prev) => prev.filter((p) => p.r2Key !== paper.r2Key));
      addToast("Paper approved", "success");
      setSelected(null);
    } catch {
      addToast("Failed to approve paper.", "error");
    }
  };

  const handleDelete = (paper) => {
    Alert.alert(
      "Delete paper",
      "Are you sure you want to delete this paper?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(
                `${process.env.EXPO_PUBLIC_API_URL}/deletepaper/${paper.r2Key}`,
                { method: "DELETE" },
              );
              if (res.status === 200) {
                setPapers((prev) => prev.filter((p) => p.r2Key !== paper.r2Key));
                addToast("Paper deleted", "success");
                setSelected(null);
              }
            } catch {
              addToast("Failed to delete paper.", "error");
            }
          },
        },
      ],
    );
  };

  if (selected) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setSelected(null)} style={styles.backBtn}>
            <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.brand} numberOfLines={1}>
            {selected.title}
          </Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.detailContent}>
          <TouchableOpacity
            style={styles.viewPdfBtn}
            activeOpacity={0.85}
            onPress={() =>
              WebBrowser.openBrowserAsync(
                `https://pdf.nitkkrpyqs.in/${selected.r2Key}`,
              )
            }
          >
            <Eye size={16} color={colors.void} strokeWidth={2} />
            <Text style={styles.viewPdfText}>View PDF</Text>
          </TouchableOpacity>

          <View style={styles.detailCard}>
            <Text style={styles.detailHeading}>Basic Information</Text>
            <DetailRow label="Title" value={selected.title} />
            <DetailRow label="Subject" value={selected.subject} />
            <DetailRow label="Subject Code" value={selected.subjectCode} />
            <DetailRow label="Year" value={selected.year} />
            <DetailRow label="Semester" value={selected.sem} />
            <DetailRow label="Exam Type" value={selected.examType} />
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailHeading}>Submission</Text>
            <View style={styles.submissionRow}>
              <User size={14} color={colors.steel} />
              <Text style={styles.submissionText}>
                {selected.name} · {selected.mail}
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              activeOpacity={0.85}
              onPress={() => handleApprove(selected)}
            >
              <Check size={16} color={colors.void} strokeWidth={2} />
              <Text style={styles.approveText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              activeOpacity={0.85}
              onPress={() => handleDelete(selected)}
            >
              <Trash2 size={16} color={colors.chrome} strokeWidth={2} />
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.brand}>Verify Papers</Text>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={papers}
        keyExtractor={(paper) => paper.r2Key}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => setSelected(item)}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.cardIconBox}>
                <FileText size={22} color={colors.chrome} strokeWidth={1.75} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {item.subject} · {item.subjectCode}
                </Text>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
              </View>
            </View>
            <Text style={styles.cardSubmitted}>Submitted by: {item.mail}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <FileText size={44} color={colors.steel} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>Nothing pending review</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const DetailRow = ({ label, value }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
};

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

  listContent: { padding: 20 },
  card: {
    backgroundColor: colors.onyxRaised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 16,
    marginBottom: 14,
  },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start" },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.onyx,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  cardMeta: { color: colors.steel, fontSize: 11.5, fontWeight: "600", marginBottom: 4 },
  cardTitle: { color: colors.chrome, fontSize: 15, fontWeight: "700", lineHeight: 20 },
  cardSubmitted: { color: colors.steel, fontSize: 12, marginTop: 12 },

  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { color: colors.chrome, fontSize: 15, fontWeight: "700", marginTop: 14 },

  detailContent: { padding: 20 },
  viewPdfBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.chrome,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 20,
  },
  viewPdfText: { color: colors.void, fontSize: 14.5, fontWeight: "700" },

  detailCard: {
    backgroundColor: colors.onyxRaised,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 16,
    marginBottom: 14,
  },
  detailHeading: { color: colors.chrome, fontSize: 14, fontWeight: "700", marginBottom: 10 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  detailLabel: { color: colors.steel, fontSize: 13 },
  detailValue: { color: colors.silver, fontSize: 13, fontWeight: "600" },
  submissionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  submissionText: { color: colors.silver, fontSize: 13 },

  actionsRow: { flexDirection: "row", gap: 12, marginTop: 6 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  approveBtn: { backgroundColor: colors.success },
  approveText: { color: colors.void, fontSize: 14, fontWeight: "700" },
  deleteBtn: { backgroundColor: colors.danger },
  deleteText: { color: colors.chrome, fontSize: 14, fontWeight: "700" },
});
