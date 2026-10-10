import {
  SuggestionsDropdown,
  useAutocomplete,
  useDropdownAnchor,
} from "@/components/SearchAutocomplete";
import Skeleton from "@/components/Skeleton";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ChevronDown,
  ExternalLink,
  FileText,
  KeyRound,
  Lock,
  Search,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export default function SyllabusScreen() {
  const { isLoggedIn } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("all"); // locked, mirrors disabled <select> on web
  const [selectedType, setSelectedType] = useState("all"); // locked, mirrors disabled <select> on web
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all"); // dead state on web too (no Year control here) — kept for parity
  const [syllabusData, setSyllabusData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchModalOpen, setBranchModalOpen] = useState(false);

  const { addToast } = useToast();
  const searchRef = useRef(null);
  const handleNav = () => router.push("/");

  const {
    open: suggestionsOpen,
    setOpen: setSuggestionsOpen,
    suggestions,
  } = useAutocomplete({
    items: syllabusData,
    searchKeys: ["courseId", "title"],
    value: searchQuery,
  });
  const { anchorRef, onAnchorLayout, dropdownTop, dropdownStyle } =
    useDropdownAnchor(suggestionsOpen);

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
          title: paper.title,
          courseId: paper.courseId,
        }),
      },
    ).catch(() => {});
    if (paper.route) router.push(`/syllabus/${paper.route}`);
  };

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/syllabus`,
      );
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const result = await response.json();
      const backendData = Array.isArray(result) ? result : (result.data ?? []);
      setSyllabusData(
        backendData.map((course) => ({
          ...course,
          downloads: course.downloadCount ?? 0,
        })),
      );
    } catch (error) {
      console.error("Failed to load syllabus catalog:", error);
      setSyllabusData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchRef.current?.focus(), 300);
    loadCatalog();
    return () => clearTimeout(t);
  }, [loadCatalog]);

  const normalize = (text = "") =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "");
  const normalizedSearch = normalize(searchQuery);

  const branches = useMemo(
    () => [...new Set(syllabusData.flatMap((paper) => paper.branches ?? []))],
    [syllabusData],
  );

  // Same reasoning as the papers screen: filtering the whole catalog on every
  // render (every keystroke, every unrelated state change) was unnecessary
  // work that contributed to input lag. Memoize against the real inputs.
  const filteredPapers = useMemo(() => {
    let result = syllabusData.filter((paper) => {
      const matchesSearch =
        normalize(paper.courseId).includes(normalizedSearch) ||
        normalize(paper.title).includes(normalizedSearch);
      const matchesBranch =
        selectedBranch === "all" || paper.branches?.includes(selectedBranch);

      if (activeTab === "all") return matchesSearch && matchesBranch;
      if (activeTab === "recent") return matchesSearch && matchesBranch;
      if (activeTab === "popular") return matchesSearch && matchesBranch;

      return (
        paper.title.toLowerCase() === activeTab.toLowerCase() &&
        matchesSearch &&
        matchesBranch
      );
    });

    if (activeTab === "popular")
      result = result.sort((a, b) => b.downloads - a.downloads);
    if (activeTab === "recent") result = [...result].reverse();
    return result;
  }, [syllabusData, normalizedSearch, selectedBranch, activeTab]);

  const tabs = [
    { key: "all", label: `All Papers (${syllabusData.length})` },
    { key: "recent", label: "Recent" },
    { key: "popular", label: "Popular" },
  ];

  if (loading && !syllabusData.length) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={styles.topBar}>
          <TouchableOpacity onPress={handleNav} activeOpacity={0.8}>
            <Text style={styles.brand}>NIT KKR PYQs</Text>
          </TouchableOpacity>
        </BlurView>
        <View style={styles.listContent}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SyllabusCardSkeleton key={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
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

      <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={styles.topBar}>
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
      </BlurView>

      <FlatList
        data={filteredPapers.slice(0, 40)}
        keyExtractor={(paper) => String(paper.id ?? paper.courseId)}
        renderItem={({ item }) => (
          <SyllabusCard paper={item} onOpen={handleDisplay} />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerRaised}>
            {/* Search — frosted glass pill (dropdown lives outside the
                pill's own overflow:hidden so it isn't clipped) */}
            <View
              ref={anchorRef}
              collapsable={false}
              onLayout={onAnchorLayout}
              style={styles.searchOuterWrap}
            >
              <BlurView intensity={35} tint={isDark ? "dark" : "light"} style={styles.searchWrap}>
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
                  onBlur={() =>
                    setTimeout(() => setSuggestionsOpen(false), 150)
                  }
                  placeholder="Search Syllabus... (Name, Subject Code)"
                  placeholderTextColor={colors.steel}
                  style={styles.searchInput}
                />
              </BlurView>
            </View>

            <Text style={styles.disclaimerText}>
              Not affiliated with, endorsed by, or officially connected with
              NIT Kurukshetra or any Government of India / State Government
              department. Curriculum shown is compiled from the official NIT
              Kurukshetra website for informational purposes only.
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
                      colors={[colors.chrome, colors.chromeSecondary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.tabChipActive}
                    >
                      <Text style={styles.tabChipTextActive}>{item.label}</Text>
                    </LinearGradient>
                  ) : (
                    <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={styles.tabChip}>
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
              Try adjusting your search or filter to find what you&apos;re
              looking for.
            </Text>
          </View>
        }
      />

      {/* Sibling of the FlatList on purpose, not nested inside its
          ListHeaderComponent — see the same note in papers/index.jsx. RN's
          virtualized list wraps the header and each row as separate sibling
          cells, so an elevated view living inside the header could still
          lose the Android stacking fight against row cells below it,
          hiding suggestions behind course cards and stealing their taps. */}
      <SuggestionsDropdown
        visible={suggestionsOpen}
        suggestions={suggestions}
        getLabel={(course) => course.title}
        getSublabel={(course) => course.courseId}
        getKey={(course) => String(course.id ?? course.courseId)}
        onSelect={(course) => {
          setSuggestionsOpen(false);
          setSearchQuery(course.courseId);
          handleDisplay(course);
        }}
        onDismiss={() => setSuggestionsOpen(false)}
        topOffset={dropdownTop ?? 202}
        style={dropdownStyle}
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
          <BlurView intensity={70} tint={isDark ? "dark" : "light"} style={styles.sheet}>
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
    </SafeAreaView>
  );
}

const FilterPill = ({ label, onPress }) => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ flex: 1 }}>
      <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={styles.filterPill}>
        <Text style={styles.filterPillText} numberOfLines={1}>
          {label}
        </Text>
        <ChevronDown size={14} color={colors.steel} />
      </BlurView>
    </TouchableOpacity>
  );
};

// Semester / Type are `disabled` on the web version — rendered as
// non-interactive glass with a lock glyph instead of a chevron.
const LockedPill = ({ label }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  return (
    <View style={[styles.filterPill, styles.filterPillLocked]}>
      <Text style={[styles.filterPillText, { opacity: 0.5 }]} numberOfLines={1}>
        {label}
      </Text>
      <Lock size={12} color={colors.steel} />
    </View>
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

const SyllabusCard = ({ paper, onOpen }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
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
              {paper?.courseId} · {paper?.branches?.join(", ")}
            </Text>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {paper?.title}
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
        </View>
      </View>
    </TouchableOpacity>
  );
};

const SyllabusCardSkeleton = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  return (
    <View style={styles.cardWrap}>
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
        </View>
      </View>
    </View>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
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
      paddingTop: 16,
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

    listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

    // Lifts the header (search + filters) above the result cards so the
    // suggestions dropdown's blurred backdrop can cover the cards below it.
    headerRaised: { zIndex: 100, elevation: 13 },

    searchOuterWrap: {
      marginTop: 20,
      zIndex: 30,
    },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.hairline,
      paddingHorizontal: 16,
      height: 52,
      overflow: "hidden",
    },
    searchInput: {
      flex: 1,
      color: colors.chrome,
      fontSize: 14.5,
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
    cardSheen: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "55%",
    },
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
