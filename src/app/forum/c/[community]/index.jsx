import Avatar from "@/components/forum/Avatar";
import ForumTopBar from "@/components/forum/ForumTopBar";
import Markdown from "@/components/forum/Markdown";
import PostCard from "@/components/forum/PostCard";
import SortBar from "@/components/forum/SortBar";
import { EmptyState, PostSkeleton } from "@/components/forum/States";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useForumGate } from "@/hooks/forum/useForumProfile";
import { useInfiniteList } from "@/hooks/forum/useInfiniteList";
import { fetchCommunity, fetchFeed, joinCommunity, leaveCommunity } from "@/services/forum";
import { copyLink } from "@/services/forumShare";
import { seedPosts } from "@/services/forumStore";
import { compactNumber } from "@/utils/forumFormat";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Info, Link2, MessagesSquare, Pin, Plus, Shield } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
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

const SHARE_BASE = "https://nitkkrpyqs.in";

export default function CommunityScreen() {
  const { community: name } = useLocalSearchParams();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { token } = useAuth();
  const { ensureMember, handleError } = useForumGate();
  const { addToast } = useToast();

  const [community, setCommunity] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [joining, setJoining] = useState(false);
  const [sortState, setSortState] = useState({ sort: "hot", t: "day" });

  const loadCommunity = useCallback(() => {
    fetchCommunity(token, name)
      .then((c) => {
        setLoadError(null);
        setCommunity(c);
      })
      .catch(setLoadError);
  }, [token, name]);

  useEffect(() => {
    loadCommunity();
  }, [loadCommunity]);

  const list = useInfiniteList(
    (cursor) => fetchFeed(token, { type: "community", name }, { ...sortState, cursor }),
    `${name}|${sortState.sort}|${sortState.t}|${token ?? ""}`,
    { onPage: (items, extra) => seedPosts([...items, ...(extra.pinned || [])]) },
  );

  const isMod = community?.myRole === "owner" || community?.myRole === "moderator";
  const joined = Boolean(community?.myRole);

  const toggleJoin = async () => {
    if (!ensureMember()) return;
    setJoining(true);
    try {
      const result = joined ? await leaveCommunity(token, name) : await joinCommunity(token, name);
      setCommunity((c) => ({ ...c, myRole: result.joined ? "member" : null, memberCount: result.memberCount }));
    } catch (error) {
      handleError(error, "Couldn't update membership");
    } finally {
      setJoining(false);
    }
  };

  if (loadError) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ForumTopBar title={`c/${name}`} />
        <EmptyState
          title={loadError.status === 404 ? "Community not found" : "Couldn't load this community"}
          subtitle={loadError.status === 404 ? "Check the name, or create it yourself." : loadError.message}
          actionLabel={loadError.status === 404 ? "Explore communities" : "Retry"}
          onAction={loadError.status === 404 ? () => router.replace("/forum/communities") : loadCommunity}
        />
      </SafeAreaView>
    );
  }

  const pinned = list.extra.pinned || [];
  const header = community ? (
    <View>
      <View style={styles.banner}>
        {community.bannerUrl ? <Image source={{ uri: community.bannerUrl }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
      </View>
      <View style={styles.headerBody}>
        <View style={styles.titleRow}>
          <View style={styles.iconRing}>
            <Avatar name={community.name} url={community.iconUrl} size={58} square />
          </View>
          <View style={{ flex: 1, marginTop: 26 }}>
            <Text style={styles.name}>c/{community.name}</Text>
            <Text style={styles.meta}>{compactNumber(community.memberCount)} members · {compactNumber(community.postCount)} posts</Text>
          </View>
          <TouchableOpacity
            style={[styles.joinBtn, joined && styles.joinedBtn]}
            onPress={toggleJoin}
            disabled={joining || community.myRole === "owner"}
          >
            {joining ? (
              <ActivityIndicator size="small" color={joined ? colors.chrome : colors.void} />
            ) : (
              <Text style={[styles.joinText, joined && styles.joinedText]}>
                {community.myRole === "owner" ? "Owner" : joined ? "Joined" : "Join"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        {community.title !== community.name ? <Text style={styles.title}>{community.title}</Text> : null}
        {community.description ? (
          <View style={{ marginTop: 6 }}>
            <Markdown size={14} numberOfLines={3}>{community.description}</Markdown>
          </View>
        ) : null}
        {community.isBanned ? <Text style={styles.banned}>You’re banned from posting and voting here.</Text> : null}
        {community.type === "restricted" ? <Text style={styles.restricted}>Only moderators can post in this community.</Text> : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actions}>
          <TouchableOpacity style={styles.action} onPress={() => router.push(`/forum/c/${community.name}/about`)}>
            <Info size={15} color={colors.silver} />
            <Text style={styles.actionText}>About & rules</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={() => copyLink(`${SHARE_BASE}/forum/c/${community.name}`).then(() => addToast("Link copied", "success"))}>
            <Link2 size={15} color={colors.silver} />
            <Text style={styles.actionText}>Copy link</Text>
          </TouchableOpacity>
          {isMod ? (
            <TouchableOpacity style={styles.action} onPress={() => router.push(`/forum/c/${community.name}/mod`)}>
              <Shield size={15} color={colors.accent} />
              <Text style={[styles.actionText, { color: colors.accent }]}>Mod tools</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>

        <SortBar sort={sortState.sort} t={sortState.t} onChange={setSortState} />

        {pinned.length ? (
          <View style={styles.pinnedBlock}>
            <View style={styles.pinnedHead}>
              <Pin size={13} color={colors.success} />
              <Text style={styles.pinnedLabel}>PINNED BY MODERATORS</Text>
            </View>
            {pinned.map((p) => <PostCard key={p.id} post={p} showCommunity={false} isMod={isMod} />)}
          </View>
        ) : null}
      </View>
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ForumTopBar title={`c/${name}`} />
      {!community || list.loading ? (
        <ScrollView contentContainerStyle={styles.listContent}>
          {header}
          <View style={{ paddingHorizontal: 16 }}>{Array.from({ length: 3 }, (_, i) => <PostSkeleton key={i} />)}</View>
        </ScrollView>
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 16 }}>
              <PostCard post={item} showCommunity={false} isMod={isMod} />
            </View>
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            list.failed ? (
              <EmptyState title="Couldn't load posts" subtitle={list.error?.message} actionLabel="Retry" onAction={list.reload} />
            ) : (
              <EmptyState icon={MessagesSquare} title="No posts here yet" subtitle="Start the first discussion in this community." />
            )
          }
          ListFooterComponent={list.loadingMore ? <ActivityIndicator color={colors.chrome} style={{ marginVertical: 16 }} /> : null}
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={list.refreshing}
              onRefresh={() => {
                loadCommunity();
                list.refresh();
              }}
              tintColor={colors.chrome}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
      {community && (community.type !== "restricted" || isMod) && !community.isBanned ? (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => ensureMember() && router.push({ pathname: "/forum/submit", params: { community: community.name } })}
          accessibilityLabel="Create post"
        >
          <Plus size={26} color={colors.void} strokeWidth={2.4} />
        </TouchableOpacity>
      ) : null}
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    listContent: { paddingBottom: 170 },
    banner: { height: 84, backgroundColor: colors.glassFillRaised, overflow: "hidden" },
    headerBody: { paddingHorizontal: 16, gap: 10, marginBottom: 12 },
    titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: -30 },
    iconRing: { padding: 3, borderRadius: 20, backgroundColor: colors.void },
    name: { color: colors.chrome, fontSize: 20, fontWeight: "800" },
    meta: { color: colors.steel, fontSize: 12.5, marginTop: 2 },
    joinBtn: {
      marginTop: 34,
      height: 34,
      minWidth: 80,
      paddingHorizontal: 16,
      borderRadius: 17,
      backgroundColor: colors.chrome,
      alignItems: "center",
      justifyContent: "center",
    },
    joinedBtn: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.hairline },
    joinText: { color: colors.void, fontWeight: "700", fontSize: 14 },
    joinedText: { color: colors.chrome },
    title: { color: colors.silver, fontSize: 15, fontWeight: "600" },
    banned: { color: colors.danger, fontSize: 13 },
    restricted: { color: colors.steel, fontSize: 13 },
    actions: { gap: 8 },
    action: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      height: 32,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    actionText: { color: colors.silver, fontSize: 13, fontWeight: "600" },
    pinnedBlock: { marginTop: 4 },
    pinnedHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
    pinnedLabel: { color: colors.steel, fontSize: 11.5, fontWeight: "700", letterSpacing: 0.6 },
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
    },
  });
