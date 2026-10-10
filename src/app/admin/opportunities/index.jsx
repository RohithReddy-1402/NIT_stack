import ActionSheet from "@/components/forum/ActionSheet";
import ForumTopBar from "@/components/forum/ForumTopBar";
import { EmptyState } from "@/components/forum/States";
import { STATUS_LABELS } from "@/constants/opportunities";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAdminOpportunities } from "@/hooks/admin/useAdminOpportunities";
import { useOpportunityStats } from "@/hooks/admin/useOpportunityStats";
import { confirm } from "@/utils/confirm";
import { router } from "expo-router";
import { Briefcase, Copy, Ellipsis, Eye, Pencil, Plus, ShieldAlert, Star, Trash2, Zap } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STAT_ROWS = [
  { key: "total", label: "Total" },
  { key: "active", label: "Active" },
  { key: "expiringSoon", label: "Expiring soon" },
  { key: "drafts", label: "Drafts" },
  { key: "scheduled", label: "Scheduled" },
  { key: "closed", label: "Closed" },
];

export default function AdminOpportunitiesDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { stats } = useOpportunityStats();
  const list = useAdminOpportunities({});
  const [menuItem, setMenuItem] = useState(null);

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace("/");
  }, [authLoading, user]);

  const openMenu = (item) => setMenuItem(item);

  if (authLoading || user?.role !== "admin") return null;

  const actionsFor = (item) => {
    if (!item) return [];
    return [
      { key: "edit", label: "Edit", icon: Pencil, onPress: () => router.push(`/admin/opportunities/${item.id}/edit`) },
      {
        key: "publish",
        label: item.status === "draft" || item.status === "scheduled" ? "Publish now" : "Unpublish",
        icon: Eye,
        onPress: () => (item.status === "draft" || item.status === "scheduled" ? list.publish(item.id) : list.unpublish(item.id)),
      },
      {
        key: "feature",
        label: item.featured ? "Unmark featured" : "Mark featured",
        icon: Star,
        onPress: () => list.setFlags(item.id, { featured: !item.featured }),
      },
      {
        key: "urgent",
        label: item.urgent ? "Unmark urgent" : "Mark urgent",
        icon: Zap,
        onPress: () => list.setFlags(item.id, { urgent: !item.urgent }),
      },
      { key: "duplicate", label: "Duplicate", icon: Copy, onPress: () => list.duplicate(item.id) },
      { key: "archive", label: "Archive", icon: ShieldAlert, onPress: () => list.archive(item.id) },
      {
        key: "delete",
        label: "Delete",
        icon: Trash2,
        destructive: true,
        onPress: async () => {
          const ok = await confirm("Delete this opportunity?", "This can't be undone.", { confirmLabel: "Delete", destructive: true });
          if (ok) list.remove(item.id);
        },
      },
    ];
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ForumTopBar
        title="Opportunities"
        right={
          <TouchableOpacity style={styles.newBtn} onPress={() => router.push("/admin/opportunities/new")}>
            <Plus size={18} color={colors.void} strokeWidth={2.4} />
          </TouchableOpacity>
        }
      />
      <FlatList
        data={list.items}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.content}
        refreshControl={undefined}
        ListHeaderComponent={
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
              {STAT_ROWS.map((s) => (
                <View key={s.key} style={styles.statCard}>
                  <Text style={styles.statValue}>{stats ? (stats[s.key] ?? 0) : "—"}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </ScrollView>

            {stats?.mostViewed?.length ? (
              <View style={styles.leaderboard}>
                <Text style={styles.leaderboardTitle}>Most viewed</Text>
                {stats.mostViewed.slice(0, 3).map((o) => (
                  <Text key={o.id} style={styles.leaderboardRow} numberOfLines={1}>{o.title} · {o.views} views</Text>
                ))}
              </View>
            ) : null}

            <TouchableOpacity style={styles.modLink} onPress={() => router.push("/admin/opportunities/moderation")}>
              <ShieldAlert size={16} color={colors.chrome} strokeWidth={1.8} />
              <Text style={styles.modLinkText}>Reports & verification queue</Text>
            </TouchableOpacity>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push(`/admin/opportunities/${item.id}/edit`)}>
              <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {item.company?.name} · {STATUS_LABELS[item.status] ?? item.status}
                {item.featured ? " · Featured" : ""}
                {item.urgent ? " · Urgent" : ""}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openMenu(item)} hitSlop={10}>
              <Ellipsis size={18} color={colors.steel} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          list.loading ? (
            <ActivityIndicator color={colors.chrome} style={{ marginTop: 30 }} />
          ) : (
            <EmptyState icon={Briefcase} title="No opportunities yet" actionLabel="Create one" onAction={() => router.push("/admin/opportunities/new")} />
          )
        }
        onEndReached={list.loadMore}
      />
      <ActionSheet visible={!!menuItem} title={menuItem?.title} actions={actionsFor(menuItem)} onClose={() => setMenuItem(null)} />
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    newBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.chrome, alignItems: "center", justifyContent: "center" },
    content: { padding: 16, paddingBottom: 110 }, // clears the floating bottom tab bar
    statsRow: { gap: 10, paddingBottom: 14 },
    statCard: {
      width: 96,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.onyxRaised,
      padding: 12,
      alignItems: "center",
    },
    statValue: { color: colors.chrome, fontSize: 20, fontWeight: "800" },
    statLabel: { color: colors.steel, fontSize: 11, marginTop: 4, textAlign: "center" },
    leaderboard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.onyxRaised,
      padding: 14,
      marginBottom: 14,
      gap: 4,
    },
    leaderboardTitle: { color: colors.chrome, fontSize: 13, fontWeight: "700", marginBottom: 4 },
    leaderboardRow: { color: colors.silver, fontSize: 12.5 },
    modLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
      padding: 14,
      marginBottom: 16,
    },
    modLinkText: { color: colors.chrome, fontWeight: "700", fontSize: 13.5 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.onyxRaised,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: 14,
      marginBottom: 10,
    },
    rowTitle: { color: colors.chrome, fontSize: 14, fontWeight: "700" },
    rowMeta: { color: colors.steel, fontSize: 12, marginTop: 3 },
  });
