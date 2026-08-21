import DownloadOptionsSheet from "@/components/DownloadOptionsSheet";
import { saveToLibrary } from "@/services/downloads";
import { BlurView } from "expo-blur";
import { File, Paths } from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import {
    Check,
    ChevronDown,
    Download,
    FileText,
    KeyRound,
    Loader2,
    Lock,
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
const getFileDownloadUrl = (paper) => paper?.fileUrl ?? paper?.pdfUrl ?? null;
const getPaperId = (paper) =>
  paper?.paper_id ?? paper?.id ?? paper?.["Course Code"];

const colors = {
  void: "#08080A",
  chrome: "#F5F5F7",
  silver: "#C9C9CE",
  steel: "#8E8E93",
  hairline: "rgba(255,255,255,0.14)",
  hairlineDim: "rgba(255,255,255,0.07)",
  glassFill: "rgba(255,255,255,0.05)",
  glassFillRaised: "rgba(255,255,255,0.08)",
  glossHi: "rgba(255,255,255,0.30)",
  glossLo: "rgba(255,255,255,0.02)",
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

export default function SyllabusScreen({
  isLoggedIn,
  user,
  onLoginClick,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("all"); // locked, mirrors disabled <select> on web
  const [selectedType, setSelectedType] = useState("all"); // locked, mirrors disabled <select> on web
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all"); // dead state on web too (no Year control here) — kept for parity
  const [syllabusData, setSyllabusData] = useState([]);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [branchModalOpen, setBranchModalOpen] = useState(false);

  const { addToast } = useToast();
  const searchRef = useRef(null);
  const [sheetPaper, setSheetPaper] = useState(null);
  const handleNav = () => router.push("Home");

  const pingDownloadCount = (paper) => {
    fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/papers/${paper.paper_id}/downloadcount`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paper_id: paper.paper_id,
          title: paper["Course Title"],
          course_code: paper["Course Code"],
        }),
      },
    ).catch(() => {});
  };

  const handleView = async (paper, onStatus) => {
    const url = getFileDownloadUrl(paper);
    if (!url) {
      addToast("Download link not available for this paper.", "error");
      return;
    }
    onStatus?.("loading");
    try {
      pingDownloadCount(paper);
      await Linking.openURL(url);
      addToast(
        `${paper.title ?? paper["Course Title"]} opened.`,
        "success",
      );
      onStatus?.("done");
      setTimeout(() => onStatus?.("idle"), 1800);
    } catch {
      onStatus?.("idle");
      addToast("Something went wrong opening that file.", "error");
    }
  };

  const handleSaveInApp = async (paper, onStatus) => {
    const url = getFileDownloadUrl(paper);
    if (!url) {
      addToast("Download link not available for this paper.", "error");
      return;
    }
    onStatus?.("loading");
    try {
      pingDownloadCount(paper);
      await saveToLibrary({
        id: getPaperId(paper),
        title: paper["Course Title"] ?? paper.title,
        code: paper["Course Code"],
        source: "syllabus",
        remoteUrl: url,
      });
      addToast(
        `${paper["Course Title"] ?? paper.title} saved to your library.`,
        "success",
      );
      onStatus?.("done");
      setTimeout(() => onStatus?.("idle"), 1800);
    } catch {
      onStatus?.("idle");
      addToast("Couldn't save that file. Try again.", "error");
    }
  };

  const handleSaveToDevice = async (paper, onStatus) => {
    const url = getFileDownloadUrl(paper);
    if (!url) {
      addToast("Download link not available for this paper.", "error");
      return;
    }
    onStatus?.("loading");
    try {
      pingDownloadCount(paper);
      const destination = new File(
        Paths.cache,
        `${paper["Course Code"] ?? "syllabus"}.pdf`.replace(
          /[^a-zA-Z0-9-_.]/g,
          "_",
        ),
      );
      const downloaded = await File.downloadFileAsync(url, destination);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloaded.uri);
      }
      onStatus?.("done");
      setTimeout(() => onStatus?.("idle"), 1800);
    } catch {
      onStatus?.("idle");
      addToast("Couldn't download that file. Try again.", "error");
    }
  };

  const handleDisplay = (paper) => {
    if (!paper) {
      addToast("Syllabus not available for this course.", "error");
      return;
    }
    fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/syllabus/${paper.id}/download`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paper_id: paper.paper_id,
          title: paper["Course Title"],
          courseId: paper["Course Code"],
        }),
      },
    ).catch(() => {});
    router.push("SyllabusDetail", { route: paper.route });
  };

  const handleiconclick = () => setAvatarOpen((v) => !v);

  useEffect(() => {
    const t = setTimeout(() => searchRef.current?.focus(), 300);

    async function loadDownloads() {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/api/syllabus`,
        );
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const result = await response.json();
        const backendData = Array.isArray(result)
          ? result
          : (result.data ?? []);

        setSyllabusData(backendData);
      } catch (error) {
        console.error("Failed to load download counts:", error);
      }
    }
    loadDownloads();
    return () => clearTimeout(t);
  }, []);

  const normalize = (text = "") =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "");
  const normalizedSearch = normalize(searchQuery);

  const branches = useMemo(
    () => [...new Set(syllabusData.flatMap((paper) => paper.Branches ?? []))],
    [syllabusData],
  );

  let filteredPapers = syllabusData.filter((paper) => {
    const matchesSearch =
      normalize(paper["Course Code"]).includes(normalizedSearch) ||
      normalize(paper["Course Title"]).includes(normalizedSearch);
    const matchesBranch =
      selectedBranch === "all" || paper.Branches?.includes(selectedBranch);

    if (activeTab === "all") return matchesSearch && matchesBranch;
    if (activeTab === "recent") return matchesSearch && matchesBranch;
    if (activeTab === "popular") return matchesSearch && matchesBranch;

    return (
      paper["Course Title"].toLowerCase() === activeTab.toLowerCase() &&
      matchesSearch &&
      matchesBranch
    );
  });

  if (activeTab === "popular")
    filteredPapers = filteredPapers.sort((a, b) => b.downloads - a.downloads);
  if (activeTab === "recent") filteredPapers = [...filteredPapers].reverse();

  const tabs = [
    { key: "all", label: `All Papers (${syllabusData.length})` },
    { key: "recent", label: "Recent" },
    { key: "popular", label: "Popular" },
  ];

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["rgba(255,255,255,0.10)", "transparent"]}
        style={styles.blobTop}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(255,255,255,0.06)", "transparent"]}
        style={styles.blobBottom}
        pointerEvents="none"
      />

      <BlurView intensity={40} tint="dark" style={styles.topBar}>
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
              <BlurView intensity={60} tint="dark" style={styles.avatarPanel}>
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
              </BlurView>
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
      </BlurView>

      <FlatList
        data={filteredPapers.slice(0, 40)}
        keyExtractor={(paper) => String(paper.id ?? paper["Course Code"])}
        renderItem={({ item }) => (
          <SyllabusCard
            paper={item}
            onOpen={handleDisplay}
            onOpenSheet={setSheetPaper}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Search — frosted glass pill */}
            <BlurView intensity={35} tint="dark" style={styles.searchWrap}>
              <Search
                size={17}
                color={colors.steel}
                style={{ marginRight: 10 }}
              />
              <TextInput
                ref={searchRef}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search Syllabus... (Name, Subject Code)"
                placeholderTextColor={colors.steel}
                style={styles.searchInput}
              />
            </BlurView>

            {/* Filters — Semester & Type are locked, same as the disabled <select>s on web */}
            <View style={styles.filterRow}>
              <LockedPill label="All Semesters" />
              <FilterPill
                label={
                  selectedBranch === "all" ? "All Branches" : selectedBranch
                }
                onPress={() => setBranchModalOpen(true)}
              />
              <LockedPill label="Mid + Sem" />
            </View>

            {/* Tabs */}
            <FlatList
              data={tabs}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(t) => t.key}
              contentContainerStyle={styles.tabsRow}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setActiveTab(item.key)}
                  activeOpacity={0.85}
                  style={styles.tabChipWrap}
                >
                  {activeTab === item.key ? (
                    <LinearGradient
                      colors={[colors.chrome, "#D8D8DD"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.tabChipActive}
                    >
                      <Text style={styles.tabChipTextActive}>{item.label}</Text>
                    </LinearGradient>
                  ) : (
                    <BlurView intensity={30} tint="dark" style={styles.tabChip}>
                      <Text style={styles.tabChipText}>{item.label}</Text>
                    </BlurView>
                  )}
                </TouchableOpacity>
              )}
            />

            {/* Active filter pills — same dead-state check as the web file */}
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
            <Text style={styles.emptyTitle}>No Syllabus content found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search or filter to find what you&apos;re looking
              for.
            </Text>
          </View>
        }
      />

      <Modal
        visible={branchModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setBranchModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setBranchModalOpen(false)}
        >
          <BlurView intensity={70} tint="dark" style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select branch</Text>
            <FlatList
              data={[
                { key: "all", label: "All Branches" },
                ...branches.map((b) => ({ key: b, label: b })),
              ]}
              keyExtractor={(o) => o.key}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.sheetOption}
                  onPress={() => {
                    setSelectedBranch(item.key);
                    setBranchModalOpen(false);
                  }}
                >
                  <Text style={styles.sheetOptionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </BlurView>
        </TouchableOpacity>
      </Modal>

      <DownloadOptionsSheet
        visible={!!sheetPaper}
        title={sheetPaper?.["Course Title"] ?? ""}
        subtitle={sheetPaper?.["Course Code"] ?? ""}
        onClose={() => setSheetPaper(null)}
        onView={() => sheetPaper && handleView(sheetPaper, sheetPaper.setStatus)}
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
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ flex: 1 }}>
    <BlurView intensity={30} tint="dark" style={styles.filterPill}>
      <Text style={styles.filterPillText} numberOfLines={1}>
        {label}
      </Text>
      <ChevronDown size={14} color={colors.steel} />
    </BlurView>
  </TouchableOpacity>
);

// Semester / Type are `disabled` on the web version — rendered as
// non-interactive glass with a lock glyph instead of a chevron.
const LockedPill = ({ label }) => (
  <View style={[styles.filterPill, styles.filterPillLocked]}>
    <Text style={[styles.filterPillText, { opacity: 0.5 }]} numberOfLines={1}>
      {label}
    </Text>
    <Lock size={12} color={colors.steel} />
  </View>
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

// Rebuilt <DownloadButton /> — same idle/loading/done cycle, same icons
// (Download, Loader2, Check) the web file imported.
const SyllabusCard = ({ paper, onOpen, onOpenSheet }) => {
  const [status, setStatus] = useState("idle");

  return (
    <TouchableOpacity
      style={styles.cardWrap}
      activeOpacity={0.9}
      onPress={() => onOpen(paper)}
    >
      <View style={styles.card}>
        <LinearGradient
          colors={[colors.glossHi, colors.glossLo, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={styles.cardSheen}
          pointerEvents="none"
        />
        <View style={styles.cardTopRow}>
          <View style={styles.cardIconBox}>
            <FileText size={22} color={colors.chrome} strokeWidth={1.75} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {paper?.["Course Code"]} · {paper?.Branches?.join(", ")}
            </Text>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {paper?.["Course Title"]}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            {paper?.level ? (
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{paper.level}</Text>
              </View>
            ) : null}
            <Text style={styles.downloadsText}>
              {paper.downloads ?? 0} downloads
            </Text>
          </View>

          <TouchableOpacity
            style={styles.downloadBtn}
            activeOpacity={0.85}
            onPress={() => onOpenSheet({ ...paper, setStatus })}
          >
            {status === "loading" ? (
              <Loader2 size={16} color={colors.void} />
            ) : status === "done" ? (
              <Check size={16} color={colors.void} />
            ) : (
              <Download size={16} color={colors.void} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.void },

  blobTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 200,
  },
  blobBottom: {
    position: "absolute",
    bottom: -140,
    left: -100,
    width: 340,
    height: 340,
    borderRadius: 200,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineDim,
    overflow: "hidden",
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
    borderRadius: 999,
  },
  loginBtnText: { color: colors.void, fontWeight: "700", fontSize: 13 },

  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.glassFillRaised,
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 14,
    zIndex: 50,
    overflow: "hidden",
  },
  avatarName: { color: colors.chrome, fontWeight: "700", fontSize: 13.5 },
  avatarEmail: { color: colors.steel, fontSize: 11.5, marginTop: 2 },
  hr: { height: 1, backgroundColor: colors.hairlineDim, marginVertical: 8 },
  avatarRow: { paddingVertical: 8 },
  avatarRowText: { color: colors.silver, fontSize: 13 },

  listContent: { paddingHorizontal: 20, paddingBottom: 40 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 16,
    height: 52,
    marginTop: 20,
    overflow: "hidden",
  },
  searchInput: {
    flex: 1,
    color: colors.chrome,
    fontSize: 14.5,
    outlineStyle: "none",
  },

  filterRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: "hidden",
  },
  filterPillLocked: {
    backgroundColor: colors.glassFill,
    borderColor: colors.hairlineDim,
  },
  filterPillText: {
    color: colors.silver,
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
    marginRight: 4,
  },

  tabsRow: { gap: 10, paddingVertical: 18 },
  tabChipWrap: { borderRadius: 999, overflow: "hidden" },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  tabChipActive: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  tabChipText: { color: colors.steel, fontSize: 13, fontWeight: "600" },
  tabChipTextActive: { color: colors.void, fontSize: 13, fontWeight: "700" },

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
    backgroundColor: colors.glassFillRaised,
    borderRadius: 999,
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

  cardWrap: { borderRadius: 22, marginBottom: 14 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.glassFill,
    padding: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 8,
  },
  cardSheen: { position: "absolute", top: 0, left: 0, right: 0, height: "55%" },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start" },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.glassFillRaised,
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
    borderTopColor: colors.hairlineDim,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  levelBadge: {
    backgroundColor: colors.glassFillRaised,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  levelBadgeText: { color: colors.silver, fontSize: 10.5, fontWeight: "700" },
  downloadsText: { color: colors.steel, fontSize: 11.5 },
  downloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
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
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: "60%",
    overflow: "hidden",
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
    borderBottomColor: colors.hairlineDim,
  },
  sheetOptionText: { color: colors.silver, fontSize: 15 },
});
