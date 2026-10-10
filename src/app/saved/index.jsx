import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { getLibrary, removeFromLibrary } from "@/services/downloads";
import { useFocusEffect } from "expo-router";
import { getContentUriAsync } from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import { BookMarked, FileText, FolderOpen, Trash2 } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TABS = [
  { key: "papers", label: "Question Papers" },
  { key: "syllabus", label: "Syllabus" },
];

export default function SavedScreen() {
  const { addToast } = useToast();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("papers");

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
    if (Platform.OS === "android") {
      try {
        const contentUri = await getContentUriAsync(item.uri);
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          type: "application/pdf",
        });
        return;
      } catch {
        // no PDF viewer registered for ACTION_VIEW — fall back to the share sheet below
      }
    }

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
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        <BookMarked size={20} color={colors.accent} strokeWidth={1.75} />
        <Text style={styles.brand}>Saved</Text>
      </View>

      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            activeOpacity={0.85}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={library.filter((item) => item.source === activeTab)}
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
                {activeTab === "syllabus"
                  ? 'Syllabus pages you save "in app" show up here.'
                  : 'Question papers you save "in app" show up here.'}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.void },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
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

  tabsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.onyxRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  tabActive: { backgroundColor: colors.chrome, borderColor: colors.chrome },
  tabText: { color: colors.silver, fontSize: 13, fontWeight: "700" },
  tabTextActive: { color: colors.void },

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
