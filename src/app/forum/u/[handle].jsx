import Avatar from "@/components/forum/Avatar";
import EditModal from "@/components/forum/EditModal";
import ForumTopBar from "@/components/forum/ForumTopBar";
import Markdown from "@/components/forum/Markdown";
import PostCard from "@/components/forum/PostCard";
import { EmptyState, PostSkeleton } from "@/components/forum/States";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { setForumProfile, useForumGate } from "@/hooks/forum/useForumProfile";
import { useInfiniteList } from "@/hooks/forum/useInfiniteList";
import { blockUser, fetchFeed, fetchUser, fetchUserComments, unblockUser, updateMyForumProfile } from "@/services/forum";
import { seedPosts } from "@/services/forumStore";
import { confirm } from "@/utils/confirm";
import { compactNumber, timeAgo } from "@/utils/forumFormat";
import { format } from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import { Bookmark, Cake, Pencil, UserX } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UserProfile() {
  const { handle } = useLocalSearchParams();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { token } = useAuth();
  const { addToast } = useToast();
  const { ensureMember, handleError } = useForumGate();

  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("posts");
  const [sort, setSort] = useState("new");
  const [editingBio, setEditingBio] = useState(false);

  const loadUser = useCallback(() => {
    fetchUser(token, handle)
      .then((u) => {
        setError(null);
        setUser(u);
      })
      .catch(setError);
  }, [token, handle]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const list = useInfiniteList(
    (cursor) =>
      tab === "posts"
        ? fetchFeed(token, { type: "user", handle }, { sort, t: "all", cursor })
        : fetchUserComments(token, handle, { cursor }),
    `${handle}|${tab}|${sort}|${token ?? ""}`,
    { onPage: (items) => tab === "posts" && seedPosts(items) },
  );

  const toggleBlock = async () => {
    if (!ensureMember()) return;
    if (!user.isBlocked && !(await confirm(`Block u/${user.handle}?`, "You won't see their posts or comments.", { confirmLabel: "Block", destructive: true }))) return;
    try {
      if (user.isBlocked) await unblockUser(token, user.handle);
      else await blockUser(token, user.handle);
      setUser((u) => ({ ...u, isBlocked: !u.isBlocked }));
      addToast(user.isBlocked ? "Unblocked" : "Blocked", "success");
    } catch (err) {
      handleError(err, "Couldn't update block");
    }
  };

  if (error) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ForumTopBar title={`u/${handle}`} />
        <EmptyState
          title={error.status === 404 ? "User not found" : "Couldn't load this profile"}
          subtitle={error.status === 404 ? "The account may have been deleted." : error.message}
          actionLabel="Retry"
          onAction={loadUser}
        />
      </SafeAreaView>
    );
  }

  const header = user ? (
    <View style={styles.header}>
      <View style={styles.top}>
        <Avatar name={user.handle} url={user.avatarUrl} size={64} />
        <View style={{ flex: 1 }}>
          <Text style={styles.handle}>u/{user.handle}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.stat}><Text style={styles.statNum}>{compactNumber(user.karma)}</Text> karma</Text>
            <View style={styles.cake}>
              <Cake size={13} color={colors.steel} />
              <Text style={styles.stat}>{format(new Date(user.createdAt), "d MMM yyyy")}</Text>
            </View>
          </View>
        </View>
      </View>
      {user.bio ? <Markdown size={14}>{user.bio}</Markdown> : user.isMe ? <Text style={styles.muted}>Add a short bio so people know who you are.</Text> : null}

      <View style={styles.buttons}>
        {user.isMe ? (
          <>
            <TouchableOpacity style={styles.btn} onPress={() => setEditingBio(true)}>
              <Pencil size={14} color={colors.chrome} />
              <Text style={styles.btnText}>Edit bio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={() => router.push("/forum/saved")}>
              <Bookmark size={14} color={colors.chrome} />
              <Text style={styles.btnText}>Saved</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={() => router.push("/forum/blocked")}>
              <UserX size={14} color={colors.chrome} />
              <Text style={styles.btnText}>Blocked</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.btn} onPress={toggleBlock}>
            <UserX size={14} color={user.isBlocked ? colors.chrome : colors.danger} />
            <Text style={[styles.btnText, !user.isBlocked && { color: colors.danger }]}>{user.isBlocked ? "Unblock" : "Block"}</Text>
          </TouchableOpacity>
        )}
      </View>
      {user.isMe ? <Text style={styles.muted}>Your anonymous posts and comments never appear here — not even to you.</Text> : null}

      <View style={styles.tabs}>
        {["posts", "comments"].map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabOn]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t === "posts" ? "Posts" : "Comments"}</Text>
          </TouchableOpacity>
        ))}
        {tab === "posts" ? (
          <TouchableOpacity style={styles.sortToggle} onPress={() => setSort((s) => (s === "new" ? "top" : "new"))}>
            <Text style={styles.sortText}>{sort === "new" ? "Newest" : "Top"} ▾</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ForumTopBar title={`u/${handle}`} />
      {!user ? (
        <View style={{ padding: 16 }}><PostSkeleton /></View>
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(x) => x.id}
          ListHeaderComponent={header}
          renderItem={({ item }) =>
            tab === "posts" ? (
              <PostCard post={item} />
            ) : (
              <TouchableOpacity style={styles.comment} onPress={() => router.push(`/forum/c/${item.post.community}/p/${item.post.id}`)}>
                <Text style={styles.commentContext} numberOfLines={1}>
                  c/{item.post.community} · {item.post.title}
                </Text>
                <Markdown size={14} numberOfLines={4}>{item.body}</Markdown>
                <Text style={styles.commentMeta}>{compactNumber(item.score)} points · {timeAgo(item.createdAt)}</Text>
              </TouchableOpacity>
            )
          }
          ListEmptyComponent={
            list.loading ? (
              <ActivityIndicator color={colors.chrome} style={{ marginTop: 24 }} />
            ) : (
              <EmptyState title={tab === "posts" ? "No posts yet" : "No comments yet"} />
            )
          }
          ListFooterComponent={list.loadingMore ? <ActivityIndicator color={colors.chrome} style={{ marginVertical: 16 }} /> : null}
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={list.refreshing}
              onRefresh={() => {
                loadUser();
                list.refresh();
              }}
              tintColor={colors.chrome}
            />
          }
          contentContainerStyle={styles.content}
        />
      )}
      <EditModal
        visible={editingBio}
        title="Bio"
        initial={user?.bio ?? ""}
        maxLength={300}
        allowEmpty
        onClose={() => setEditingBio(false)}
        onSave={async (bio) => {
          try {
            const { profile } = await updateMyForumProfile(token, { bio });
            setForumProfile(profile);
            setUser((u) => ({ ...u, bio: profile.bio }));
          } catch (err) {
            handleError(err, "Couldn't save your bio");
            throw err;
          }
        }}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    content: { paddingHorizontal: 16, paddingBottom: 140 },
    header: { gap: 12, paddingVertical: 16 },
    top: { flexDirection: "row", alignItems: "center", gap: 14 },
    handle: { color: colors.chrome, fontSize: 21, fontWeight: "800" },
    statsRow: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 4 },
    stat: { color: colors.steel, fontSize: 13 },
    statNum: { color: colors.chrome, fontWeight: "700" },
    cake: { flexDirection: "row", alignItems: "center", gap: 4 },
    muted: { color: colors.steel, fontSize: 12.5 },
    buttons: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    btn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      height: 34,
      paddingHorizontal: 14,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    btnText: { color: colors.chrome, fontWeight: "600", fontSize: 13 },
    tabs: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
    tab: { height: 32, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.hairline, justifyContent: "center" },
    tabOn: { backgroundColor: colors.chrome, borderColor: colors.chrome },
    tabText: { color: colors.silver, fontWeight: "600", fontSize: 13 },
    tabTextOn: { color: colors.void },
    sortToggle: { marginLeft: "auto" },
    sortText: { color: colors.steel, fontSize: 13, fontWeight: "600" },
    comment: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.hairline, gap: 6 },
    commentContext: { color: colors.steel, fontSize: 12.5 },
    commentMeta: { color: colors.steel, fontSize: 12 },
  });
