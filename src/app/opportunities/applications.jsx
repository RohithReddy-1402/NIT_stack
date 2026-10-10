import ForumTopBar from "@/components/forum/ForumTopBar";
import { EmptyState } from "@/components/forum/States";
import ApplicationStatusSheet from "@/components/opportunities/ApplicationStatusSheet";
import { APPLICATION_STATUS_LABELS, opportunityTypeLabel } from "@/constants/opportunities";
import { useTheme } from "@/contexts/ThemeContext";
import { useMyApplications } from "@/hooks/opportunities/useMyApplications";
import { relativeDeadlineLabel } from "@/utils/deadline";
import { confirm } from "@/utils/confirm";
import { router } from "expo-router";
import { ClipboardList, Trash2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** "My Applications" — a fully optional, self-reported tracker. Never touches the real external application. */
export default function MyApplicationsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { items, loading, reload, setStatus, remove } = useMyApplications();
  const [active, setActive] = useState(null);

  const removeRow = async (app) => {
    const ok = await confirm("Remove this tracked application?", "This only removes it from your tracker — it doesn't withdraw a real application.", {
      confirmLabel: "Remove",
      destructive: true,
    });
    if (ok) remove(app);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ForumTopBar title="My Applications" subtitle="Optional — for your own tracking" />
      {loading ? (
        <ActivityIndicator color={colors.chrome} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={false} onRefresh={reload} tintColor={colors.chrome} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={() => router.push(`/opportunities/${item.opportunity?.slug}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>{item.opportunity?.title}</Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {item.opportunity?.company?.name} · {opportunityTypeLabel(item.opportunity?.type)}
                </Text>
                <Text style={styles.deadline}>{relativeDeadlineLabel(item.opportunity?.applicationDeadline)}</Text>
              </View>
              <View style={styles.rowActions}>
                <TouchableOpacity style={styles.statusPill} onPress={() => setActive(item)}>
                  <Text style={styles.statusText}>{APPLICATION_STATUS_LABELS[item.status] ?? item.status}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeRow(item)} hitSlop={8}>
                  <Trash2 size={16} color={colors.danger} strokeWidth={1.8} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState
              icon={ClipboardList}
              title="No tracked applications"
              subtitle="Mark an opportunity as Interested or Applied from its detail page to track it here."
              actionLabel="Browse opportunities"
              onAction={() => router.push("/opportunities")}
            />
          }
        />
      )}
      <ApplicationStatusSheet
        visible={!!active}
        onSelect={(status) => {
          if (active) setStatus(active.opportunityId, status);
          setActive(null);
        }}
        onClose={() => setActive(null)}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    content: { padding: 16, paddingBottom: 110 }, // clears the floating bottom tab bar
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.onyxRaised,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: 14,
      marginBottom: 10,
    },
    title: { color: colors.chrome, fontSize: 14.5, fontWeight: "700" },
    meta: { color: colors.steel, fontSize: 12, marginTop: 3 },
    deadline: { color: colors.silver, fontSize: 12, marginTop: 4 },
    rowActions: { alignItems: "flex-end", gap: 8 },
    statusPill: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    statusText: { color: colors.chrome, fontSize: 11.5, fontWeight: "700" },
  });
