import Avatar from "@/components/forum/Avatar";
import PostCard from "@/components/forum/PostCard";
import SortBar from "@/components/forum/SortBar";
import { EmptyState, PostSkeleton } from "@/components/forum/States";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useForumGate, useForumProfile } from "@/hooks/forum/useForumProfile";
import { useInfiniteList } from "@/hooks/forum/useInfiniteList";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { fetchFeed, fetchMyCommunities } from "@/services/forum";
import { seedPosts } from "@/services/forumStore";
import { onTabReselect } from "@/utils/tabRefresh";
import { router } from "expo-router";
import { Compass, MessagesSquare, Plus, Search, UserRound } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForumHome() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { token, isLoggedIn } = useAuth();
  const { status, profile } = useForumProfile();
  const { ensureMember } = useForumGate();
  const listRef = useRef(null);

  const [feed, setFeed] = useState("home"); // home | popular
  const [sortState, setSortState] = useState({ sort: "hot", t: "day" });
  const [communities, setCommunities] = useState([]);

  const list = useInfiniteList(
    (cursor) => fetchFeed(token, { type: feed }, { ...sortState, cursor }),
    `${feed}|${sortState.sort}|${sortState.t}|${token ?? ""}`,
    { onPage: (items) => seedPosts(items) },
  );

  const loadCommunities = useCallback(() => {
    if (!token || status !== "ready") return;
    fetchMyCommunities(token)
      .then((r) => setCommunities(r.items))
      .catch(() => {});
  }, [token, status]);

  useEffect(() => {
    loadCommunities();
  }, [loadCommunities]);

  useRefetchOnFocus(() => {
    loadCommunities();
  });

  const { refresh } = list;
  useEffect(
    () =>
      onTabReselect((key) => {
        if (key !== "/forum") return;
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
        refresh();
        loadCommunities();
      }),
    [refresh, loadCommunities],
  );

  // Joined communities only apply while signed in with a forum profile.
  const joined = token && status === "ready" ? communities : [];

  const openCreate = () => ensureMember() && router.push("/forum/submit");
  const openMe = () => {
    if (!isLoggedIn) return router.push("/login");
    if (status === "none") return router.push("/forum/onboarding");
    if (profile) router.push(`/forum/u/${profile.handle}`);
  };

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.segment}>
        {["home", "popular"].map((f) => (
          <TouchableOpacity key={f} style={[styles.segmentBtn, feed === f && styles.segmentBtnActive]} onPress={() => setFeed(f)}>
            <Text style={[styles.segmentText, feed === f && styles.segmentTextActive]}>{f === "home" ? "Home" : "Popular"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        <TouchableOpacity style={styles.stripItem} onPress={() => ensureMember() && router.push("/forum/new-community")}>
          <View style={styles.stripIcon}><Plus size={20} color={colors.chrome} /></View>
          <Text style={styles.stripLabel}>Create</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.stripItem} onPress={() => router.push("/forum/communities")}>
          <View style={styles.stripIcon}><Compass size={20} color={colors.chrome} /></View>
          <Text style={styles.stripLabel}>Explore</Text>
        </TouchableOpacity>
        {joined.map((c) => (
          <TouchableOpacity key={c.name} style={styles.stripItem} onPress={() => router.push(`/forum/c/${c.name}`)}>
            <Avatar name={c.name} url={c.iconUrl} size={44} square />
            <Text style={styles.stripLabel} numberOfLines={1}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {feed === "home" && list.extra.source === "popular" ? (
        <TouchableOpacity style={styles.notice} onPress={() => router.push("/forum/communities")}>
          <Text style={styles.noticeText}>
            Join communities to personalise Home — showing Popular for now. <Text style={styles.noticeLink}>Explore →</Text>
          </Text>
        </TouchableOpacity>
      ) : null}

      <SortBar sort={sortState.sort} t={sortState.t} onChange={setSortState} />
    </View>
  );

  let body;
  if (list.loading) {
    body = (
      <ScrollView contentContainerStyle={styles.content}>
        {header}
        {Array.from({ length: 4 }, (_, i) => <PostSkeleton key={i} />)}
      </ScrollView>
    );
  } else if (list.failed) {
    body = (
      <ScrollView contentContainerStyle={styles.content}>
        {header}
        <EmptyState title="Couldn't load posts" subtitle={list.error?.message} actionLabel="Retry" onAction={list.reload} />
      </ScrollView>
    );
  } else {
    body = (
      <FlatList
        ref={listRef}
        data={list.items}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyState
            icon={MessagesSquare}
            title="No posts yet"
            subtitle={sortState.sort === "top" ? "Nothing in this time range — try a longer one." : "Be the first to start a discussion."}
            actionLabel="Create a post"
            onAction={openCreate}
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
        <Text style={styles.brand}>Forum</Text>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/forum/search")} accessibilityLabel="Search">
          <Search size={21} color={colors.chrome} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={openMe} accessibilityLabel="My forum profile">
          {profile ? <Avatar name={profile.handle} url={profile.avatarUrl} size={28} /> : <UserRound size={21} color={colors.chrome} strokeWidth={2} />}
        </TouchableOpacity>
      </View>
      {body}
      <TouchableOpacity style={styles.fab} onPress={openCreate} accessibilityLabel="Create post">
        <Plus size={26} color={colors.void} strokeWidth={2.4} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, gap: 6 },
    brand: { flex: 1, color: colors.chrome, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
    iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    content: { paddingHorizontal: 16, paddingBottom: 170 },
    headerBlock: { gap: 12, marginBottom: 12 },
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
    strip: { gap: 14, paddingVertical: 2 },
    stripItem: { alignItems: "center", width: 58, gap: 5 },
    stripIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
      alignItems: "center",
      justifyContent: "center",
    },
    stripLabel: { color: colors.silver, fontSize: 11, maxWidth: 58 },
    notice: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
      padding: 12,
    },
    noticeText: { color: colors.silver, fontSize: 13, lineHeight: 18 },
    noticeLink: { color: colors.accent, fontWeight: "700" },
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
