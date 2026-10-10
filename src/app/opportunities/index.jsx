import { EmptyState } from "@/components/forum/States";
import FilterSheet from "@/components/opportunities/FilterSheet";
import OpportunityCard from "@/components/opportunities/OpportunityCard";
import { OpportunitySkeleton } from "@/components/opportunities/States";
import { SORT_OPTIONS } from "@/constants/opportunities";
import { useTheme } from "@/contexts/ThemeContext";
import { useOpportunitiesFeed } from "@/hooks/opportunities/useOpportunitiesFeed";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { onTabReselect } from "@/utils/tabRefresh";
import { router } from "expo-router";
import { Briefcase, ChevronLeft, Plus, SlidersHorizontal, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TABS = [
  { key: "all", label: "All" },
  { key: "recommended", label: "Recommended" },
];

export default function OpportunitiesHome() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const listRef = useRef(null);

  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("newest");
  const [filters, setFilters] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Debounced search — avoids firing a feed request on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => setFilters((prev) => ({ ...prev, q: query || undefined })), 400);
    return () => clearTimeout(timeout);
  }, [query]);

  const activeFilterCount = Object.keys(filters).filter((k) => k !== "q" && filters[k]).length;

  const list = useOpportunitiesFeed({ type: tab }, { ...filters, sort });

  useRefetchOnFocus(list.refresh);

  const { refresh } = list;
  useEffect(
    () =>
      onTabReselect((key) => {
        if (key !== "/opportunities") return;
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
        refresh();
      }),
    [refresh],
  );

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search internships, companies, skills…"
          placeholderTextColor={colors.steel}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterOpen(true)} accessibilityLabel="Filters">
          <SlidersHorizontal size={18} color={colors.chrome} strokeWidth={1.9} />
          {activeFilterCount > 0 ? <View style={styles.filterDot} /> : null}
        </TouchableOpacity>
      </View>

      <View style={styles.segment}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.key} style={[styles.segmentBtn, tab === t.key && styles.segmentBtnActive]} onPress={() => setTab(t.key)}>
            <Text style={[styles.segmentText, tab === t.key && styles.segmentTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
        {SORT_OPTIONS.map((s) => (
          <TouchableOpacity key={s.value} style={[styles.sortChip, sort === s.value && styles.sortChipActive]} onPress={() => setSort(s.value)}>
            <Text style={[styles.sortChipText, sort === s.value && styles.sortChipTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {activeFilterCount > 0 ? (
        <TouchableOpacity style={styles.clearFilters} onPress={() => setFilters((prev) => ({ q: prev.q }))}>
          <X size={13} color={colors.steel} />
          <Text style={styles.clearFiltersText}>{activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"} active — clear</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  let body;
  if (list.loading) {
    body = (
      <ScrollView contentContainerStyle={styles.content}>
        {header}
        {Array.from({ length: 4 }, (_, i) => <OpportunitySkeleton key={i} />)}
      </ScrollView>
    );
  } else if (list.failed) {
    body = (
      <ScrollView contentContainerStyle={styles.content}>
        {header}
        <EmptyState title="Couldn't load opportunities" subtitle={list.error?.message} actionLabel="Retry" onAction={list.reload} />
      </ScrollView>
    );
  } else {
    body = (
      <FlatList
        ref={listRef}
        data={list.items}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => <OpportunityCard opportunity={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState
            icon={Briefcase}
            title={tab === "recommended" ? "No recommendations yet" : "No opportunities found"}
            subtitle={
              tab === "recommended"
                ? "Fill in your career profile to get personalized picks."
                : "Try adjusting your search or filters."
            }
            actionLabel={tab === "recommended" ? "Set up career profile" : undefined}
            onAction={tab === "recommended" ? () => router.push("/profile/career") : undefined}
          />
        }
        ListFooterComponent={list.loadingMore ? <ActivityIndicator color={colors.chrome} style={{ marginVertical: 16 }} /> : null}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={colors.chrome} />}
        contentContainerStyle={styles.content}
        removeClippedSubviews
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.brand}>Opportunities</Text>
        <View style={styles.backBtn} />
      </View>
      {body}
      <FilterSheet visible={filterOpen} value={filters} onApply={(next) => setFilters((prev) => ({ ...next, q: prev.q }))} onClose={() => setFilterOpen(false)} />
      <TouchableOpacity style={styles.fab} onPress={() => router.push("/opportunities/submit")} accessibilityLabel="Submit an opportunity">
        <Plus size={26} color={colors.void} strokeWidth={2.4} />
      </TouchableOpacity>
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
      paddingTop: 8,
      paddingBottom: 12,
    },
    backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    brand: { color: colors.chrome, fontSize: 20, fontWeight: "800", flex: 1, textAlign: "center" },
    content: { paddingHorizontal: 16, paddingBottom: 170 },
    headerBlock: { gap: 12, marginBottom: 12 },
    searchRow: { flexDirection: "row", gap: 8, alignItems: "center" },
    searchInput: {
      flex: 1,
      height: 44,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
      color: colors.chrome,
      paddingHorizontal: 14,
      fontSize: 14.5,
    },
    filterBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
      alignItems: "center",
      justifyContent: "center",
    },
    filterDot: { position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
    segment: {
      flexDirection: "row",
      backgroundColor: colors.glassFill,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: 3,
    },
    segmentBtn: { flex: 1, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
    segmentBtnActive: { backgroundColor: colors.onyxRaised, borderWidth: 1, borderColor: colors.hairline },
    segmentText: { color: colors.steel, fontWeight: "600", fontSize: 14 },
    segmentTextActive: { color: colors.chrome },
    sortRow: { gap: 8, paddingVertical: 2 },
    sortChip: { height: 32, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.hairline, justifyContent: "center" },
    sortChipActive: { backgroundColor: colors.chrome, borderColor: colors.chrome },
    sortChipText: { color: colors.silver, fontWeight: "600", fontSize: 12.5 },
    sortChipTextActive: { color: colors.void },
    clearFilters: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
    clearFiltersText: { color: colors.steel, fontSize: 12.5 },
    // bottom: 96 + zIndex: 101 clears the floating LiquidGlassTabBar
    // (height 72, bottom: 0, zIndex: 100) — same convention as forum's FAB.
    fab: {
      position: "absolute",
      right: 20,
      bottom: 96,
      zIndex: 101,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.chrome,
      alignItems: "center",
      justifyContent: "center",
      elevation: 6,
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
  });
