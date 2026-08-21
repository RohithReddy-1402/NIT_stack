import DownloadOptionsSheet from "@/components/DownloadOptionsSheet";
import { saveToLibrary } from "@/services/downloads";
import { File, Paths } from "expo-file-system";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import {
  Check,
  ChevronDown,
  Download,
  FileText,
  KeyRound,
  Loader2,
  Search,
  X,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useToast } from "../../contexts/ToastContext";
import { usePapers } from "../../hooks/usePapers";

const colors = {
  void: "#0A0A0B",
  onyx: "#141416",
  onyxRaised: "#1C1C1F",
  chrome: "#F5F5F7",
  silver: "#C9C9CE",
  steel: "#8E8E93",
  hairline: "#2C2C30",
};

const SEMESTERS = [
  "Sem-1",
  "Sem-2",
  "Sem-3",
  "Sem-4",
  "Sem-5",
  "Sem-6",
  "Sem-7",
  "Sem-8",
];
const ADDITIONAL_TABS = ["Sem", "Mid-1", "Mid-2"];

export default function QuestionPapersScreen({
  isLoggedIn,
  user,
  onLoginClick,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [filterModal, setFilterModal] = useState(null); // null | "semester" | "year" | "type"

  const { addToast } = useToast();
  const searchRef = useRef(null);
  const [sheetPaper, setSheetPaper] = useState(null);

  const handleNav = () => router.push("Home");
  const { questionPapers, loading, error, refetch } = usePapers();

  const pingDownloadCount = (key) => {
    fetch(`${process.env.EXPO_PUBLIC_API_URL}/papers/downloadcount`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ r2Key: key }),
    }).catch(() => {});
  };

  const handleView = async (paper, onStatus) => {
    if (!paper?.r2Key) return;
    onStatus?.("loading");
    try {
      pingDownloadCount(paper.r2Key);
      await Linking.openURL(`https://pdf.nitkkrpyqs.in/${paper.r2Key}`);
      onStatus?.("done");
      setTimeout(() => onStatus?.("idle"), 1800);
    } catch {
      onStatus?.("idle");
      addToast("Couldn't open that paper. Try again.", "error");
    }
  };

  const handleSaveInApp = async (paper, onStatus) => {
    if (!paper?.r2Key) return;
    onStatus?.("loading");
    try {
      pingDownloadCount(paper.r2Key);
      await saveToLibrary({
        id: paper.r2Key,
        title: `${paper.title} ${paper.examType} Paper`,
        subject: paper.subject,
        code: paper.subjectCode,
        year: paper.year,
        source: "papers",
        remoteUrl: `https://pdf.nitkkrpyqs.in/${paper.r2Key}`,
      });
      addToast(`${paper.title} saved to your library.`, "success");
      onStatus?.("done");
      setTimeout(() => onStatus?.("idle"), 1800);
    } catch {
      onStatus?.("idle");
      addToast("Couldn't save that paper. Try again.", "error");
    }
  };

  const handleSaveToDevice = async (paper, onStatus) => {
    if (!paper?.r2Key) return;
    onStatus?.("loading");
    try {
      pingDownloadCount(paper.r2Key);
      const destination = new File(
        Paths.cache,
        `${paper.subjectCode}-${paper.examType}-${paper.year}.pdf`.replace(
          /[^a-zA-Z0-9-_.]/g,
          "_",
        ),
      );
      const downloaded = await File.downloadFileAsync(
        `https://pdf.nitkkrpyqs.in/${paper.r2Key}`,
        destination,
      );
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloaded.uri);
      }
      onStatus?.("done");
      setTimeout(() => onStatus?.("idle"), 1800);
    } catch {
      onStatus?.("idle");
      addToast("Couldn't download that paper. Try again.", "error");
    }
  };

  const handleiconclick = () => setAvatarOpen((v) => !v);

  useEffect(() => {
    const t = setTimeout(() => searchRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  const years = useMemo(
    () =>
      [...new Set(questionPapers?.map((paper) => paper.year))].sort(
        (a, b) => b - a,
      ),
    [questionPapers],
  );

  const subjects = useMemo(
    () => [...new Set(questionPapers?.map((paper) => paper.subject))],
    [questionPapers],
  );

  let filteredPapers = questionPapers?.filter((paper) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      paper.title.toLowerCase().includes(q) ||
      paper.subject.toLowerCase().includes(q) ||
      paper.subjectCode.toLowerCase().includes(q) ||
      paper.subjectCode.replace("-", "").toLowerCase().includes(q) ||
      paper.subjectCode.replace(" ", "").includes(q);
    const matchesSemester =
      selectedSemester === "all" ||
      paper.sem === selectedSemester.split("-")[1];
    const matchesYear =
      selectedYear === "all" || parseInt(paper.year) === parseInt(selectedYear);
    const matchesType =
      selectedType === "all" || paper.examType === selectedType;

    if (activeTab === "all")
      return matchesSearch && matchesSemester && matchesYear && matchesType;
    if (activeTab === "recent")
      return matchesSearch && matchesSemester && matchesYear && matchesType;
    if (activeTab === "popular")
      return matchesSearch && matchesSemester && matchesYear && matchesType;
    if (activeTab === "Mid-1")
      return (
        paper.examType === "Mid-1" &&
        matchesSearch &&
        matchesSemester &&
        matchesYear
      );
    if (activeTab === "Mid-2")
      return (
        paper.examType === "Mid-2" &&
        matchesSearch &&
        matchesSemester &&
        matchesYear
      );
    if (activeTab === "Sem")
      return (
        paper.examType === "Sem" &&
        matchesSearch &&
        matchesSemester &&
        matchesYear
      );

    return (
      paper.subject.toLowerCase() === activeTab.toLowerCase() &&
      matchesSearch &&
      matchesSemester &&
      matchesYear &&
      matchesType
    );
  });

  if (activeTab === "popular")
    filteredPapers = filteredPapers?.sort((a, b) => b.downloads - a.downloads);
  if (activeTab === "recent") filteredPapers = [...filteredPapers].reverse();

  const tabs = [
    { key: "all", label: `All Papers (${questionPapers?.length})` },
    { key: "recent", label: "Recent" },
    { key: "popular", label: "Popular" },
    ...ADDITIONAL_TABS?.map((t) => ({
      key: t,
      label: t === "Sem" ? "Semester" : t,
    })),
    ...subjects?.map((s) => ({ key: s.toLowerCase(), label: s })),
  ];
  console.log(filteredPapers?.length, "filteredPapers?.length");
  return (
    <View style={styles.screen}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleNav} activeOpacity={0.8}>
          <Text style={styles.brand}>NIT KKR PYQs</Text>
        </TouchableOpacity>

        {isLoggedIn ? (
          <View>
            <TouchableOpacity
              onPress={handleiconclick}
              style={styles.avatarBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.avatarInitial}>
                {(user?.name || "U").charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
            {avatarOpen && (
              <View style={styles.avatarPanel}>
                <Text style={styles.avatarName}>{user?.name}</Text>
                <Text style={styles.avatarEmail} numberOfLines={1}>
                  {user?.email}
                </Text>
                <View style={styles.hr} />
                <TouchableOpacity style={styles.avatarRow}>
                  <Text style={styles.avatarRowText}>Dashboard</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.avatarRow}>
                  <Text style={styles.avatarRowText}>Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.avatarRow}>
                  <Text style={styles.avatarRowText}>Earnings</Text>
                </TouchableOpacity>
                <View style={styles.hr} />
                <TouchableOpacity
                  style={styles.avatarRow}
                  onPress={() => {
                    setAvatarOpen(false);
                    onLogout();
                  }}
                >
                  <Text style={[styles.avatarRowText, { color: "#FF453A" }]}>
                    Sign out
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <TouchableOpacity
            onPress={onLoginClick}
            style={styles.loginBtn}
            activeOpacity={0.85}
          >
            <KeyRound size={14} color={colors.void} strokeWidth={2} />
            <Text style={styles.loginBtnText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredPapers?.slice(0, 40)}
        keyExtractor={(paper) => paper.r2Key}
        renderItem={({ item }) => (
          <PaperCard paper={item} onOpenSheet={setSheetPaper} />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.searchWrap}>
              <Search
                size={17}
                color={colors.steel}
                style={{ marginRight: 10 }}
              />
              <TextInput
                ref={searchRef}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search question papers... (Name, Subject Code)"
                placeholderTextColor={colors.steel}
                style={styles.searchInput}
              />
            </View>

            {/* Filter pills -> open bottom-sheet modals (RN has no <select>) */}
            <View style={styles.filterRow}>
              <FilterPill
                label={
                  selectedSemester === "all"
                    ? "All Semesters"
                    : selectedSemester
                }
                onPress={() => setFilterModal("semester")}
              />
              <FilterPill
                label={
                  selectedYear === "all" ? "All Years" : String(selectedYear)
                }
                onPress={() => setFilterModal("year")}
              />
              <FilterPill
                label={selectedType === "all" ? "Mid + Sem" : selectedType}
                onPress={() => setFilterModal("type")}
              />
            </View>

            {/* Tabs */}
            <FlatList
              data={tabs}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(t) => t.r2Key}
              contentContainerStyle={styles.tabsRow}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setActiveTab(item.key)}
                  style={[
                    styles.tabChip,
                    activeTab === item.key && styles.tabChipActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabChipText,
                      activeTab === item.key && styles.tabChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />

            {/* Active filter pills */}
            {(selectedSemester !== "all" || selectedYear !== "all") && (
              <View style={styles.activeFiltersRow}>
                <Text style={styles.activeFiltersLabel}>Active filters:</Text>
                {selectedSemester !== "all" && (
                  <ClearablePill
                    label={
                      selectedSemester.includes("Sem")
                        ? `Semester ${selectedSemester.split("-")[1]}`
                        : selectedSemester
                    }
                    onClear={() => setSelectedSemester("all")}
                  />
                )}
                {selectedYear !== "all" && (
                  <ClearablePill
                    label={`Year: ${selectedYear}`}
                    onClear={() => setSelectedYear("all")}
                  />
                )}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FileText size={44} color={colors.steel} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No question papers found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search or filters to find what you&apos;re
              looking for.
            </Text>
          </View>
        }
      />

      <Modal
        visible={!!filterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModal(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setFilterModal(null)}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {filterModal === "semester" && "Select semester"}
              {filterModal === "year" && "Select year"}
              {filterModal === "type" && "Select type"}
            </Text>
            <FlatList
              data={
                filterModal === "semester"
                  ? [
                      {
                        key: "all",
                        label: "All Semesters",
                      },
                      ...(SEMESTERS ?? []).map((s) => ({
                        key: String(s),
                        label: String(s),
                      })),
                    ]
                  : filterModal === "year"
                    ? [
                        {
                          key: "all",
                          label: "All Years",
                        },
                        ...(years ?? []).map((y) => ({
                          key: String(y),
                          label: String(y),
                        })),
                      ]
                    : [
                        {
                          key: "all",
                          label: "Mid + Sem",
                        },
                        ...(ADDITIONAL_TABS ?? []).map((t) => ({
                          key: String(t),
                          label: t === "Sem" ? "Semester" : t,
                        })),
                      ]
              }
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.sheetOption}
                  onPress={() => {
                    if (filterModal === "semester") {
                      setSelectedSemester(item.key);
                    }

                    if (filterModal === "year") {
                      setSelectedYear(
                        item.key === "all" ? "all" : Number(item.key),
                      );
                    }

                    if (filterModal === "type") {
                      setSelectedType(item.key);
                    }

                    setFilterModal(null);
                  }}
                >
                  <Text style={styles.sheetOptionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <DownloadOptionsSheet
        visible={!!sheetPaper}
        title={
          sheetPaper ? `${sheetPaper.title} ${sheetPaper.examType} Paper` : ""
        }
        subtitle={
          sheetPaper
            ? `Sem ${sheetPaper.sem} · ${sheetPaper.subjectCode} · ${sheetPaper.year}`
            : ""
        }
        onClose={() => setSheetPaper(null)}
        onView={() =>
          sheetPaper && handleView(sheetPaper, sheetPaper.setStatus)
        }
        onSaveInApp={() =>
          sheetPaper && handleSaveInApp(sheetPaper, sheetPaper.setStatus)
        }
        onSaveToDevice={() =>
          sheetPaper && handleSaveToDevice(sheetPaper, sheetPaper.setStatus)
        }
      />
    </View>
  );
}

const FilterPill = ({ label, onPress }) => (
  <TouchableOpacity
    style={styles.filterPill}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Text style={styles.filterPillText} numberOfLines={1}>
      {label}
    </Text>
    <ChevronDown size={14} color={colors.steel} />
  </TouchableOpacity>
);

const ClearablePill = ({ label, onClear }) => (
  <View style={styles.clearablePill}>
    <Text style={styles.clearablePillText}>{label}</Text>
    <TouchableOpacity
      onPress={onClear}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <X size={12} color={colors.chrome} />
    </TouchableOpacity>
  </View>
);

// Replaces <DownloadButton /> — mirrors its idle -> loading -> done states
// using the same lucide icons (Download, Loader2, Check) the web file imported.
const PaperCard = ({ paper, onOpenSheet }) => {
  const [status, setStatus] = useState("idle");

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onOpenSheet({ ...paper, setStatus })}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.cardIconBox}>
          <FileText size={22} color={colors.chrome} strokeWidth={1.75} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.cardMeta} numberOfLines={1}>
            Sem {paper?.sem} · {paper?.subjectCode} · {paper?.year}
          </Text>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {paper?.title} {paper?.examType} Paper
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{paper?.level}</Text>
          </View>
          <Text style={styles.downloadsText}>{paper.downloads} downloads</Text>
        </View>

        <View style={styles.downloadBtn}>
          {status === "loading" ? (
            <Loader2 size={16} color={colors.void} />
          ) : status === "done" ? (
            <Check size={16} color={colors.void} />
          ) : (
            <Download size={16} color={colors.void} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.void },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  brand: {
    color: colors.chrome,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.chrome,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  loginBtnText: { color: colors.void, fontWeight: "700", fontSize: 13 },

  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.onyxRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: colors.chrome, fontWeight: "700", fontSize: 13 },
  avatarPanel: {
    position: "absolute",
    top: 44,
    right: 0,
    width: 200,
    backgroundColor: colors.onyxRaised,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 14,
    zIndex: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
  },
  avatarName: { color: colors.chrome, fontWeight: "700", fontSize: 13.5 },
  avatarEmail: { color: colors.steel, fontSize: 11.5, marginTop: 2 },
  hr: { height: 1, backgroundColor: colors.hairline, marginVertical: 8 },
  avatarRow: { paddingVertical: 8 },
  avatarRowText: { color: colors.silver, fontSize: 13 },

  listContent: { paddingHorizontal: 20, paddingBottom: 40 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.onyxRaised,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
    height: 50,
    marginTop: 20,
  },
  searchInput: {
    flex: 1,
    color: colors.chrome,
    fontSize: 14.5,
    height: 50,
    borderWidth: 0,
    outlineStyle: "none",
  },

  filterRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  filterPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.onyxRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterPillText: {
    color: colors.silver,
    fontSize: 12.5,
    fontWeight: "600",
    flexShrink: 1,
    marginRight: 4,
  },

  tabsRow: { gap: 8, paddingVertical: 18 },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.onyx,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  tabChipActive: { backgroundColor: colors.chrome, borderColor: colors.chrome },
  tabChipText: { color: colors.steel, fontSize: 13, fontWeight: "600" },
  tabChipTextActive: { color: colors.void },

  activeFiltersRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  activeFiltersLabel: { color: colors.steel, fontSize: 12 },
  clearablePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.onyxRaised,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  clearablePillText: {
    color: colors.chrome,
    fontSize: 11.5,
    fontWeight: "600",
  },

  card: {
    backgroundColor: colors.onyxRaised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
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
  cardMeta: {
    color: colors.steel,
    fontSize: 11.5,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  cardTitle: {
    color: colors.chrome,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  levelBadge: {
    backgroundColor: colors.onyx,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  levelBadgeText: { color: colors.silver, fontSize: 10.5, fontWeight: "700" },
  downloadsText: { color: colors.steel, fontSize: 11.5 },
  downloadBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.chrome,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    color: colors.chrome,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 14,
  },
  emptySubtitle: {
    color: colors.steel,
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.onyxRaised,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: "60%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.hairline,
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetTitle: {
    color: colors.chrome,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  sheetOption: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  sheetOptionText: { color: colors.silver, fontSize: 15 },
});
