import ForumTopBar from "@/components/forum/ForumTopBar";
import { EmptyState } from "@/components/forum/States";
import OpportunityCard from "@/components/opportunities/OpportunityCard";
import { OpportunitySkeleton } from "@/components/opportunities/States";
import { useTheme } from "@/contexts/ThemeContext";
import { useOpportunitiesFeed } from "@/hooks/opportunities/useOpportunitiesFeed";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { router } from "expo-router";
import { Bookmark } from "lucide-react-native";
import { useMemo } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SavedOpportunitiesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const list = useOpportunitiesFeed({ type: "saved" }, {});
  useRefetchOnFocus(list.refresh);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ForumTopBar title="Saved opportunities" />
      {list.loading ? (
        <>
          {Array.from({ length: 3 }, (_, i) => <OpportunitySkeleton key={i} />)}
        </>
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => <OpportunityCard opportunity={item} />}
          ListEmptyComponent={
            <EmptyState
              icon={Bookmark}
              title="Nothing saved yet"
              subtitle="Bookmark opportunities to find them here and set deadline reminders."
              actionLabel="Browse opportunities"
              onAction={() => router.push("/opportunities")}
            />
          }
          ListFooterComponent={list.loadingMore ? <ActivityIndicator color={colors.chrome} style={{ marginVertical: 16 }} /> : null}
          onEndReached={list.loadMore}
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
    content: { padding: 16, paddingBottom: 110 }, // clears the floating bottom tab bar
  });
