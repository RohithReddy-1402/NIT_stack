import Avatar from "@/components/forum/Avatar";
import ForumTopBar from "@/components/forum/ForumTopBar";
import { EmptyState } from "@/components/forum/States";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useForumGate } from "@/hooks/forum/useForumProfile";
import { fetchBlocks, unblockRef, unblockUser } from "@/services/forum";
import { timeAgo } from "@/utils/forumFormat";
import { UserX } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Blocks made from anonymous content are listed without a name — the server never reveals who they are. */
export default function BlockedUsers() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { token } = useAuth();
  const { addToast } = useToast();
  const { handleError } = useForumGate();
  const [items, setItems] = useState(null);

  const load = useCallback(() => {
    if (!token) return;
    fetchBlocks(token)
      .then((r) => setItems(r.items))
      .catch((error) => {
        setItems([]);
        handleError(error, "Couldn't load blocked users");
      });
  }, [token, handleError]);

  useEffect(() => {
    load();
  }, [load]);

  const unblock = async (item) => {
    try {
      if (item.handle) await unblockUser(token, item.handle);
      else await unblockRef(token, item.viaRef);
      setItems((list) => list.filter((x) => x !== item));
      addToast("Unblocked", "success");
    } catch (error) {
      handleError(error, "Couldn't unblock");
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ForumTopBar title="Blocked users" />
      {items === null ? (
        <ActivityIndicator color={colors.chrome} style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(x) => x.handle ?? x.viaRef}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Avatar name={item.handle} anonymous={!item.handle} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.handle ? `u/${item.handle}` : "Anonymous author"}</Text>
                <Text style={styles.meta}>
                  {item.handle ? "" : `Blocked from a ${item.viaRef?.startsWith("c:") ? "comment" : "post"} · `}
                  {timeAgo(item.blockedAt) === "now" ? "just now" : `${timeAgo(item.blockedAt)} ago`}
                </Text>
              </View>
              <TouchableOpacity style={styles.btn} onPress={() => unblock(item)}>
                <Text style={styles.btnText}>Unblock</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<EmptyState icon={UserX} title="You haven't blocked anyone" />}
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
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    name: { color: colors.chrome, fontSize: 15, fontWeight: "600" },
    meta: { color: colors.steel, fontSize: 12.5, marginTop: 2 },
    btn: { height: 32, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.hairline, justifyContent: "center" },
    btnText: { color: colors.chrome, fontWeight: "600", fontSize: 13 },
  });
