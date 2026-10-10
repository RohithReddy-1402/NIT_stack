import RichTextViewer from "@/components/forum/RichTextViewer";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { approvePendingPost, fetchPendingPosts, ForumError, rejectPendingPost } from "@/services/forum";
import { router } from "expo-router";
import { Check, ChevronLeft, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PendingPostsAdmin() {
  const { user, token, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { addToast } = useToast();

  const [items, setItems] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace("/");
  }, [authLoading, user]);

  const load = useCallback(() => {
    if (!token) return;
    fetchPendingPosts(token, { limit: 50 })
      .then((page) => setItems(page.items))
      .catch(() => setItems([]));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id, action) => {
    setBusyId(id);
    try {
      if (action === "approve") await approvePendingPost(token, id);
      else await rejectPendingPost(token, id, "Doesn't meet guidelines");
      setItems((prev) => prev.filter((p) => p.id !== id));
      addToast(action === "approve" ? "Approved" : "Rejected", "success");
    } catch (error) {
      addToast(error instanceof ForumError ? error.message : "Something went wrong", "error");
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || user?.role !== "admin") return null;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.side}>
          <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.brand}>Pending Posts</Text>
        <View style={styles.side} />
      </View>

      {items === null ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>Nothing waiting for review.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.headerRow}>
                <Text style={styles.communityText}>{`c/${item.community.name}`}</Text>
                {item.isAnonymous ? <Text style={styles.anonTag}>anonymous</Text> : null}
              </View>
              <Text style={styles.title}>{item.title}</Text>
              {item.company || item.tags?.length ? (
                <View style={styles.tagRow}>
                  {item.company ? (
                    <View style={[styles.chip, styles.companyChip]}>
                      <Text style={styles.companyChipText}>{item.company}</Text>
                    </View>
                  ) : null}
                  {(item.tags || []).map((t) => (
                    <View key={t} style={styles.chip}>
                      <Text style={styles.chipText}>{t}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <View style={styles.bodyBox}>
                <RichTextViewer html={item.body} />
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  disabled={busyId === item.id}
                  onPress={() => act(item.id, "reject")}
                >
                  {busyId === item.id ? <ActivityIndicator size="small" color={colors.chrome} /> : <X size={16} color={colors.chrome} />}
                  <Text style={styles.actionText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  disabled={busyId === item.id}
                  onPress={() => act(item.id, "approve")}
                >
                  {busyId === item.id ? (
                    <ActivityIndicator size="small" color={colors.void} />
                  ) : (
                    <Check size={16} color={colors.void} />
                  )}
                  <Text style={[styles.actionText, styles.approveText]}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
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
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    side: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    brand: { color: colors.chrome, fontSize: 17, fontWeight: "700" },
    list: { padding: 16, paddingBottom: 60, gap: 14 },
    empty: { color: colors.steel, textAlign: "center", marginTop: 40 },
    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.onyxRaised,
      padding: 14,
      gap: 10,
    },
    headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    communityText: { color: colors.steel, fontSize: 12, fontWeight: "700" },
    anonTag: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: "700",
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    title: { color: colors.chrome, fontSize: 16, fontWeight: "700" },
    tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.glassFill },
    chipText: { color: colors.silver, fontSize: 11, fontWeight: "600" },
    companyChip: { backgroundColor: colors.chrome },
    companyChipText: { color: colors.void, fontSize: 11, fontWeight: "700" },
    bodyBox: { maxHeight: 260, overflow: "hidden" },
    actions: { flexDirection: "row", gap: 10 },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      height: 38,
      borderRadius: 12,
    },
    rejectBtn: { backgroundColor: colors.onyx ?? colors.glassFill, borderWidth: 1, borderColor: colors.hairline },
    approveBtn: { backgroundColor: colors.chrome },
    actionText: { color: colors.chrome, fontWeight: "700", fontSize: 13.5 },
    approveText: { color: colors.void },
  });
