import { useToast } from "@/contexts/ToastContext";
import { getLibrary, removeFromLibrary } from "@/services/downloads";
import { useFocusEffect } from "expo-router";
import * as Sharing from "expo-sharing";
import { BookMarked, FileText, FolderOpen, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const colors = {
  void: "#0A0A0B",
  onyx: "#141416",
  onyxRaised: "#1C1C1F",
  chrome: "#F5F5F7",
  silver: "#C9C9CE",
  steel: "#8E8E93",
  hairline: "#2C2C30",
  accent: "#8E8EFF",
};

export default function SavedScreen() {
  const { addToast } = useToast();
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const items = await getLibrary();
      setLibrary(items);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLibrary();
    }, [loadLibrary]),
  );

  const handleOpen = async (item) => {
    try {
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(item.uri);
      } else {
        addToast("Opening files isn't supported on this device.", "error");
      }
    } catch {
      addToast("Couldn't open that file.", "error");
    }
  };

  const handleRemove = (item) => {
    Alert.alert(
      "Remove download",
      `Remove "${item.title}" from your library?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await removeFromLibrary(item.id);
            setLibrary((prev) => prev.filter((i) => i.id !== item.id));
            addToast("Removed from library", "success");
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <BookMarked size={20} color={colors.accent} strokeWidth={1.75} />
        <Text style={styles.brand}>Saved</Text>
      </View>

      <FlatList
        data={library}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardIconBox}>
                <FileText size={22} color={colors.chrome} strokeWidth={1.75} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {[item.code, item.year].filter(Boolean).join(" · ") ||
                    (item.source === "syllabus"
                      ? "Syllabus"
                      : "Question Paper")}
                </Text>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.savedAt}>
                Saved {new Date(item.downloadedAt).toLocaleDateString()}
              </Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  activeOpacity={0.8}
                  onPress={() => handleOpen(item)}
                >
                  <FolderOpen size={15} color={colors.void} strokeWidth={2} />
                  <Text style={styles.actionText}>Open</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeBtn}
                  activeOpacity={0.8}
                  onPress={() => handleRemove(item)}
                >
                  <Trash2 size={15} color={colors.chrome} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <BookMarked size={44} color={colors.steel} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>Nothing saved yet</Text>
              <Text style={styles.emptySubtitle}>
                Papers and syllabus files you save &quot;in app&quot; show up
                here.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.void },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  brand: {
    color: colors.chrome,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 },

  card: {
    backgroundColor: colors.onyxRaised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 16,
    marginBottom: 14,
  },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start" },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.onyx,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  cardMeta: {
    color: colors.steel,
    fontSize: 11.5,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardTitle: {
    color: colors.chrome,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  savedAt: { color: colors.steel, fontSize: 11.5, flexShrink: 1 },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.chrome,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionText: { color: colors.void, fontSize: 12.5, fontWeight: "700" },
  removeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.onyx,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    color: colors.chrome,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 14,
  },
  emptySubtitle: {
    color: colors.steel,
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
});
