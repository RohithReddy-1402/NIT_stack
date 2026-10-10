import DownloadOptionsSheet from "@/components/DownloadOptionsSheet";
import {
  SuggestionsDropdown,
  useAutocomplete,
  useDropdownAnchor,
} from "@/components/SearchAutocomplete";
import Skeleton from "@/components/Skeleton";
import { saveToDeviceStorage, saveToLibrary } from "@/services/downloads";
import { getPaperAccessUrl } from "@/services/papers";
import { File, Paths } from "expo-file-system";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import * as WebBrowser from "expo-web-browser";
import {
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  WifiOff,
  X,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import { usePapers } from "../../hooks/usePapers";

const OFFICIAL_SITE_URL = "https://www.nitkkr.ac.in";

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

export default function QuestionPapersScreen() {
  const { isLoggedIn, token } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [filterModal, setFilterModal] = useState(null); // null | "semester" | "year" | "type"

  const { addToast } = useToast();
  const searchRef = useRef(null);
  const [sheetPaper, setSheetPaper] = useState(null);

  const handleNav = () => router.push("Home");
  const { questionPapers, loading, error, refetch } = usePapers();

  const {
    open: suggestionsOpen,
    setOpen: setSuggestionsOpen,
    suggestions,
  } = useAutocomplete({
    items: questionPapers ?? [],
    searchKeys: ["title", "subject", "subjectCode"],
    value: searchQuery,
  });
  const { anchorRef, onAnchorLayout, dropdownTop, dropdownStyle } =
    useDropdownAnchor(suggestionsOpen);

  // The papers R2 bucket is private now — every view/download needs a signed
  // URL from the backend (which also checks login + premium/free-quota), not
  // the raw https://pdf.nitkkrpyqs.in/<r2Key> path used before.
  const reportAccessError = (error, fallback, onStatus) => {
    onStatus?.("idle");
    if (error?.code === "LOGIN_REQUIRED") {
      addToast("Log in to view or download papers.", "error");
      router.push("/login");
    } else if (error?.code === "PREMIUM_REQUIRED") {
      addToast(error.message, "error");
    } else {
      addToast(fallback, "error");
    }
  };

  const handleView = async (paper, onStatus) => {
    if (!paper?.r2Key) return;
    onStatus?.("loading");
    try {
      const signedUrl = await getPaperAccessUrl(token, paper.r2Key, "view");
      await WebBrowser.openBrowserAsync(signedUrl);
      onStatus?.("done");
      setTimeout(() => onStatus?.("idle"), 1800);
    } catch (error) {
      reportAccessError(error, "Couldn't open that paper. Try again.", onStatus);
    }
  };

  const handleSaveInApp = async (paper, onStatus) => {
    if (!paper?.r2Key) return;
    onStatus?.("loading");
    try {
      const signedUrl = await getPaperAccessUrl(token, paper.r2Key, "download");
      await saveToLibrary({
        id: paper.r2Key,
        title: `${paper.title} ${paper.examType} Paper`,
        subject: paper.subject,
        code: paper.subjectCode,
        year: paper.year,
        source: "papers",
        remoteUrl: signedUrl,
      });
      addToast(`${paper.title} saved to your library.`, "success");
      onStatus?.("done");
      setTimeout(() => onStatus?.("idle"), 1800);
    } catch (error) {
      reportAccessError(error, "Couldn't save that paper. Try again.", onStatus);
    }
  };

  const handleSaveToDevice = async (paper, onStatus) => {
    if (!paper?.r2Key) return;
    onStatus?.("loading");
    try {
      const signedUrl = await getPaperAccessUrl(token, paper.r2Key, "download");
      const filename = `${paper.subjectCode}-${paper.examType}-${paper.year}.pdf`.replace(
        /[^a-zA-Z0-9-_.]/g,
        "_",
      );

      const { savedDirectly } = await saveToDeviceStorage(signedUrl, filename);
      if (savedDirectly) {
        addToast(`${paper.title} saved to your device.`, "success");
      } else {
        const destination = new File(Paths.cache, filename);
        const downloaded = await File.downloadFileAsync(signedUrl, destination);
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloaded.uri);
        }
      }
      onStatus?.("done");
      setTimeout(() => onStatus?.("idle"), 1800);
    } catch (error) {
      reportAccessError(error, "Couldn't download that paper. Try again.", onStatus);
    }
  };

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

  const subjects = useMemo(() => {
    const seen = new Map();
    for (const paper of questionPapers ?? []) {
      const subject = paper.subject?.trim();
      if (!subject) continue;
      const dedupeKey = subject.toLowerCase();
      if (!seen.has(dedupeKey)) seen.set(dedupeKey, subject);
    }
    return [...seen.values()];
  }, [questionPapers]);

  // Filtering 300+ papers with several string ops per item is expensive
  // enough that doing it unmemoized on every render (every keystroke, every
  // unrelated state change) was a real source of UI jank/input lag on
  // mid-range devices. Memoize it against just the inputs that matter.
  const filteredPapers = useMemo(() => {
    let result = questionPapers?.filter((paper) => {
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
        selectedYear === "all" ||
        parseInt(paper.year) === parseInt(selectedYear);
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
        paper.subject.trim().toLowerCase() === activeTab.toLowerCase() &&
        matchesSearch &&
        matchesSemester &&
        matchesYear &&
        matchesType
      );
    });

    if (activeTab === "popular")
      result = result?.sort((a, b) => b.downloads - a.downloads);
    if (activeTab === "recent") result = [...(result ?? [])].reverse();
    return result;
  }, [
    questionPapers,
    searchQuery,
    selectedSemester,
    selectedYear,
    selectedType,
    activeTab,
  ]);

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

  if (error) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleNav} activeOpacity={0.8}>
            <Text style={styles.brand}>NIT KKR PYQs</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorState}>
          <WifiOff size={44} color={colors.steel} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Couldn&apos;t load question papers</Text>
          <Text style={styles.emptySubtitle}>
            Check your internet connection and try again.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            activeOpacity={0.85}
            onPress={refetch}
          >
            <RefreshCw size={15} color={colors.void} strokeWidth={2} />
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !questionPapers?.length) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleNav} activeOpacity={0.8}>
            <Text style={styles.brand}>NIT KKR PYQs</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.listContent}>
          {Array.from({ length: 6 }).map((_, i) => (
            <PaperCardSkeleton key={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleNav} activeOpacity={0.8}>
          <Text style={styles.brand}>NIT KKR PYQs</Text>
        </TouchableOpacity>

        {!isLoggedIn && (
          <TouchableOpacity
            onPress={() => router.push("login")}
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
          <View style={styles.headerRaised}>
            <View
              ref={anchorRef}
              collapsable={false}
              onLayout={onAnchorLayout}
              style={styles.searchWrap}
            >
              <Search
                size={17}
                color={colors.steel}
                style={{ marginRight: 10 }}
              />
              <TextInput
                ref={searchRef}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setSuggestionsOpen(true);
                }}
                onFocus={() => setSuggestionsOpen(true)}
                onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
                placeholder="Search question papers... (Name, Subject Code)"
                placeholderTextColor={colors.steel}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.searchInput}
              />
            </View>

            <Text style={styles.disclaimerText}>
              Not affiliated with, endorsed by, or officially connected with
              NIT Kurukshetra or any Government of India / State Government
              department. Papers are set by the official NIT Kurukshetra
              examination cell and shared here for informational purposes
              only.
            </Text>
            <TouchableOpacity
              style={styles.sourceRow}
              activeOpacity={0.7}
              onPress={() => Linking.openURL(OFFICIAL_SITE_URL)}
            >
              <ExternalLink size={12} color={colors.accent} strokeWidth={2} />
              <Text style={styles.sourceText}>
                Official source: nitkkr.ac.in
              </Text>
            </TouchableOpacity>

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
              keyExtractor={(t) => t.key}
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

      {/* Rendered as a sibling *after* the FlatList (not nested inside its
          ListHeaderComponent) on purpose: React Native's virtualized lists
          wrap the header and every row as separate sibling "cells" under the
          hood, so an elevated/zIndexed view living inside the header could
          still lose the stacking fight against row cells below it on
          Android — which was both hiding suggestions behind paper cards and
          stealing taps meant for a suggestion. A later JSX sibling of the
          FlatList itself always paints on top, unconditionally. */}
      <SuggestionsDropdown
        visible={suggestionsOpen}
        suggestions={suggestions}
        getLabel={(paper) => paper.subject}
        getSublabel={(paper) =>
          `${paper.subjectCode} · ${paper.examType ?? paper.title} · ${paper.year}`
        }
        getKey={(paper) => paper.r2Key}
        onSelect={(paper) => {
          setSuggestionsOpen(false);
          setSearchQuery(paper.subjectCode);
          setSheetPaper(paper);
        }}
        onDismiss={() => setSuggestionsOpen(false)}
        topOffset={dropdownTop ?? 200}
        style={dropdownStyle}
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
    </SafeAreaView>
  );
}

const FilterPill = ({ label, onPress }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  return (
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
};

const ClearablePill = ({ label, onClear }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  return (
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
};

// Replaces <DownloadButton /> — mirrors its idle -> loading -> done states
// using the same lucide icons (Download, Loader2, Check) the web file imported.
const PaperCard = ({ paper, onOpenSheet }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
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

const PaperCardSkeleton = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Skeleton style={styles.cardIconBox} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Skeleton style={{ width: "50%", height: 11, marginBottom: 8 }} />
          <Skeleton style={{ width: "85%", height: 15 }} />
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <Skeleton style={{ width: 54, height: 20, borderRadius: 20 }} />
          <Skeleton style={{ width: 70, height: 11 }} />
        </View>
        <Skeleton style={styles.downloadBtn} />
      </View>
    </View>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.void },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
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

  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  // Lifts the header (search + filters) above the result cards so the
  // suggestions dropdown's blurred backdrop can cover the cards below it.
  headerRaised: { zIndex: 100, elevation: 13 },

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
    zIndex: 30,
  },
  searchInput: {
    flex: 1,
    color: colors.chrome,
    fontSize: 14.5,
    height: 50,
    borderWidth: 0,
    outlineStyle: "none",
  },

  disclaimerText: {
    color: colors.steel,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 12,
  },
  sourceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  sourceText: {
    color: colors.accent,
    fontSize: 11.5,
    fontWeight: "600",
    textDecorationLine: "underline",
    flexShrink: 1,
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

  errorState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.chrome,
  },
  retryBtnText: { color: colors.void, fontSize: 13.5, fontWeight: "700" },

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

