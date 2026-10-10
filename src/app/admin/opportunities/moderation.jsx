import ForumTopBar from "@/components/forum/ForumTopBar";
import { EmptyState } from "@/components/forum/States";
import { OPPORTUNITY_REPORT_REASONS } from "@/constants/opportunities";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAdminOpportunities } from "@/hooks/admin/useAdminOpportunities";
import { useEditSuggestionsQueue, useOpportunityReportsQueue } from "@/hooks/admin/useOpportunityModeration";
import { timeAgo } from "@/utils/forumFormat";
import { router } from "expo-router";
import { Pencil, ShieldCheck } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const reasonLabel = (r) => OPPORTUNITY_REPORT_REASONS.find((x) => x.value === r)?.label ?? r;
const TABS = ["reports", "suggestions", "verification"];
const TAB_LABELS = { reports: "Reports", suggestions: "Edit suggestions", verification: "Verification" };

/** Reports queue + verification workflow — mirrors forum's mod.jsx Queue tab. */
export default function OpportunityModerationScreen() {
  const { user, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [tab, setTab] = useState("reports");

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace("/");
  }, [authLoading, user]);

  if (authLoading || user?.role !== "admin") return null;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ForumTopBar title="Moderation" subtitle="Opportunities" />
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabOn]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{TAB_LABELS[t]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === "reports" ? (
        <Reports styles={styles} colors={colors} />
      ) : tab === "suggestions" ? (
        <EditSuggestions styles={styles} colors={colors} />
      ) : (
        <VerificationQueue styles={styles} colors={colors} />
      )}
    </SafeAreaView>
  );
}

function Reports({ styles, colors }) {
  const queue = useOpportunityReportsQueue();
  return (
    <FlatList
      data={queue.items}
      keyExtractor={(r) => r.id}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.opportunity?.title}</Text>
          <Text style={styles.cardMeta}>{item.opportunity?.company?.name} · {timeAgo(item.createdAt)}</Text>
          <View style={styles.reasons}>
            {(item.reasons ?? [item.reason]).filter(Boolean).map((r) => (
              <Text key={r} style={styles.reason}>{reasonLabel(r)}</Text>
            ))}
          </View>
          {item.details ? <Text style={styles.detail}>&ldquo;{item.details}&rdquo;</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actBtn, styles.dismiss]} onPress={() => queue.resolve(item, "dismiss")}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actBtn, styles.remove]} onPress={() => queue.resolve(item, "close")}>
              <Text style={styles.removeText}>Close listing</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      ListEmptyComponent={
        queue.loading ? (
          <ActivityIndicator color={colors.chrome} style={{ marginTop: 30 }} />
        ) : (
          <EmptyState icon={ShieldCheck} title="No open reports" subtitle="Reported opportunities show up here for review." />
        )
      }
      onEndReached={queue.loadMore}
    />
  );
}

function EditSuggestions({ styles, colors }) {
  const queue = useEditSuggestionsQueue();
  return (
    <FlatList
      data={queue.items}
      keyExtractor={(s) => s.id}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => item.opportunity?.id && router.push(`/admin/opportunities/${item.opportunity.id}/edit`)}
        >
          <Text style={styles.cardTitle} numberOfLines={1}>{item.opportunity?.title}</Text>
          <Text style={styles.cardMeta}>{item.opportunity?.company?.name} · {timeAgo(item.createdAt)}</Text>
          <Text style={styles.detail}>&ldquo;{item.note}&rdquo;</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actBtn, styles.dismiss]}
              onPress={() => item.opportunity?.id && router.push(`/admin/opportunities/${item.opportunity.id}/edit`)}
            >
              <Text style={styles.dismissText}>Open in editor</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actBtn} onPress={() => queue.resolve(item, "resolved")}>
              <Text style={styles.neutralText}>Mark resolved</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actBtn, styles.remove]} onPress={() => queue.resolve(item, "dismissed")}>
              <Text style={styles.removeText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        queue.loading ? (
          <ActivityIndicator color={colors.chrome} style={{ marginTop: 30 }} />
        ) : (
          <EmptyState icon={Pencil} title="No suggested edits" subtitle="Corrections students suggest on a listing show up here." />
        )
      }
      onEndReached={queue.loadMore}
    />
  );
}

function VerificationQueue({ styles, colors }) {
  const list = useAdminOpportunities({ verification: "pending" });
  return (
    <FlatList
      data={list.items}
      keyExtractor={(o) => o.id}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardMeta}>{item.company?.name} · Source: {item.links?.sourceUrl || "—"}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actBtn, styles.dismiss]} onPress={() => list.verify(item.id, "verified")}>
              <Text style={styles.dismissText}>Mark verified</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actBtn} onPress={() => list.verify(item.id, "under_review")}>
              <Text style={styles.neutralText}>Under review</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actBtn, styles.remove]} onPress={() => list.verify(item.id, "expired")}>
              <Text style={styles.removeText}>Mark expired</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      ListEmptyComponent={
        list.loading ? (
          <ActivityIndicator color={colors.chrome} style={{ marginTop: 30 }} />
        ) : (
          <EmptyState icon={ShieldCheck} title="Nothing pending verification" />
        )
      }
      onEndReached={list.loadMore}
    />
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
    tab: { height: 32, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.hairline, justifyContent: "center" },
    tabOn: { backgroundColor: colors.chrome, borderColor: colors.chrome },
    tabText: { color: colors.silver, fontWeight: "600", fontSize: 13 },
    tabTextOn: { color: colors.void },
    content: { padding: 16, paddingBottom: 110 }, // clears the floating bottom tab bar
    card: {
      backgroundColor: colors.onyxRaised,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: 14,
      marginBottom: 12,
      gap: 8,
    },
    cardTitle: { color: colors.chrome, fontSize: 14.5, fontWeight: "700" },
    cardMeta: { color: colors.steel, fontSize: 12 },
    reasons: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    reason: {
      color: colors.chrome,
      fontSize: 11.5,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: 8,
      paddingHorizontal: 7,
      paddingVertical: 2,
      overflow: "hidden",
    },
    detail: { color: colors.silver, fontSize: 12.5, fontStyle: "italic" },
    actions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    actBtn: { height: 34, paddingHorizontal: 14, borderRadius: 17, borderWidth: 1, borderColor: colors.hairline, justifyContent: "center" },
    dismiss: { borderColor: colors.success },
    dismissText: { color: colors.success, fontWeight: "700", fontSize: 13 },
    neutralText: { color: colors.chrome, fontWeight: "600", fontSize: 13 },
    remove: { borderColor: colors.danger },
    removeText: { color: colors.danger, fontWeight: "700", fontSize: 13 },
  });
