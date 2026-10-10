import Avatar from "@/components/forum/Avatar";
import ForumTopBar from "@/components/forum/ForumTopBar";
import { EmptyState } from "@/components/forum/States";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useForumGate } from "@/hooks/forum/useForumProfile";
import { useInfiniteList } from "@/hooks/forum/useInfiniteList";
import { fetchCommunities, joinCommunity, leaveCommunity } from "@/services/forum";
import { compactNumber } from "@/utils/forumFormat";
import { router } from "expo-router";
import { Plus, Users } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExploreCommunities() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { token } = useAuth();
  const { ensureMember, handleError } = useForumGate();
  const [sort, setSort] = useState("popular");
  const [busy, setBusy] = useState(null);

  const list = useInfiniteList((cursor) => fetchCommunities(token, { sort, cursor }), `${sort}|${token ?? ""}`);

  const toggle = async (c) => {
    if (!ensureMember()) return;
    setBusy(c.name);
    try {
      const r = c.myRole ? await leaveCommunity(token, c.name) : await joinCommunity(token, c.name);
      list.setItems((items) =>
        items.map((x) => (x.name === c.name ? { ...x, myRole: r.joined ? "member" : null, memberCount: r.memberCount } : x)),
      );
    } catch (error) {
      handleError(error, "Couldn't update membership");
    } finally {
      setBusy(null);
    }
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.tabs}>
        {["popular", "new"].map((s) => (
          <TouchableOpacity key={s} style={[styles.tab, sort === s && styles.tabOn]} onPress={() => setSort(s)}>
            <Text style={[styles.tabText, sort === s && styles.tabTextOn]}>{s === "popular" ? "Popular" : "Newest"}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.create} onPress={() => ensureMember() && router.push("/forum/new-community")}>
        <Plus size={18} color={colors.chrome} />
        <Text style={styles.createText}>Create a community</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ForumTopBar title="Communities" />
      <FlatList
        data={list.items}
        keyExtractor={(c) => c.name}
        ListHeaderComponent={header}
        renderItem={({ item: c }) => (
          <TouchableOpacity style={styles.row} onPress={() => router.push(`/forum/c/${c.name}`)}>
            <Avatar name={c.name} url={c.iconUrl} size={42} square />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>c/{c.name}</Text>
              <Text style={styles.meta} numberOfLines={1}>
                {c.title !== c.name ? `${c.title} · ` : ""}{compactNumber(c.memberCount)} members
              </Text>
            </View>
            {c.myRole === "owner" ? (
              <Text style={styles.owner}>Owner</Text>
            ) : (
              <TouchableOpacity style={[styles.join, c.myRole && styles.joined]} onPress={() => toggle(c)} disabled={busy === c.name}>
                {busy === c.name ? (
                  <ActivityIndicator size="small" color={colors.chrome} />
                ) : (
                  <Text style={[styles.joinText, c.myRole && styles.joinedText]}>{c.myRole ? "Joined" : "Join"}</Text>
                )}
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          list.loading ? (
            <ActivityIndicator color={colors.chrome} style={{ marginTop: 30 }} />
          ) : list.failed ? (
            <EmptyState title="Couldn't load communities" subtitle={list.error?.message} actionLabel="Retry" onAction={list.reload} />
          ) : (
            <EmptyState icon={Users} title="No communities yet" subtitle="Create the first one for your branch, hostel or club." />
          )
        }
        ListFooterComponent={list.loadingMore ? <ActivityIndicator color={colors.chrome} style={{ marginVertical: 16 }} /> : null}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={colors.chrome} />}
        contentContainerStyle={styles.content}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    content: { paddingHorizontal: 16, paddingBottom: 140 },
    header: { gap: 12, paddingVertical: 12 },
    tabs: { flexDirection: "row", gap: 8 },
    tab: { height: 32, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.hairline, justifyContent: "center" },
    tabOn: { backgroundColor: colors.chrome, borderColor: colors.chrome },
    tabText: { color: colors.silver, fontWeight: "600", fontSize: 13 },
    tabTextOn: { color: colors.void },
    create: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.hairline,
    },
    createText: { color: colors.chrome, fontWeight: "600" },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    name: { color: colors.chrome, fontSize: 15, fontWeight: "700" },
    meta: { color: colors.steel, fontSize: 12.5, marginTop: 2 },
    owner: { color: colors.steel, fontSize: 12.5 },
    join: {
      height: 32,
      minWidth: 72,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: colors.chrome,
      alignItems: "center",
      justifyContent: "center",
    },
    joined: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.hairline },
    joinText: { color: colors.void, fontWeight: "700", fontSize: 13 },
    joinedText: { color: colors.chrome },
  });
