import ForumTopBar from "@/components/forum/ForumTopBar";
import PostCard from "@/components/forum/PostCard";
import { EmptyState, PostSkeleton } from "@/components/forum/States";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useInfiniteList } from "@/hooks/forum/useInfiniteList";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { fetchFeed } from "@/services/forum";
import { seedPosts } from "@/services/forumStore";
import { router } from "expo-router";
import { Bookmark } from "lucide-react-native";
import { useEffect, useMemo } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SavedPosts() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { token, isLoggedIn, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.replace("/login");
  }, [authLoading, isLoggedIn]);

  const list = useInfiniteList((cursor) => fetchFeed(token, { type: "saved" }, { cursor }), token ?? "", {
    enabled: Boolean(token),
    onPage: (items) => seedPosts(items),
  });
  // Unsaving on the post screen should drop it from here when you come back.
  useRefetchOnFocus(list.refresh);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ForumTopBar title="Saved posts" />
      {list.loading ? (
        <View style={styles.content}>{Array.from({ length: 3 }, (_, i) => <PostSkeleton key={i} />)}</View>
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PostCard post={item} />}
          ListEmptyComponent={
            list.failed ? (
              <EmptyState title="Couldn't load saved posts" subtitle={list.error?.message} actionLabel="Retry" onAction={list.reload} />
            ) : (
              <EmptyState icon={Bookmark} title="Nothing saved yet" subtitle="Tap ··· → Save on any post to keep it here." />
            )
          }
          ListFooterComponent={list.loadingMore ? <ActivityIndicator color={colors.chrome} style={{ marginVertical: 16 }} /> : null}
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={colors.chrome} />}
          contentContainerStyle={styles.content}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    content: { padding: 16, paddingBottom: 140 },
  });
