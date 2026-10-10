import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { fetchPendingPostsCount } from "@/services/forum";
import { router, useFocusEffect } from "expo-router";
import { Briefcase, ChevronLeft, ChevronRight, MessagesSquare, ShieldCheck } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SECTIONS = [
  {
    key: "verify",
    label: "Verify Papers",
    description: "Review and approve student-submitted question papers",
    icon: ShieldCheck,
    route: "/verifyPaper",
  },
  {
    key: "opportunities",
    label: "Opportunities",
    description: "Manage internships, placements, and other opportunity postings",
    icon: Briefcase,
    route: "/admin/opportunities",
  },
  {
    key: "pending-posts",
    label: "Pending Posts",
    description: "Review interview/OA experience posts before they go public",
    icon: MessagesSquare,
    route: "/admin/pending-posts",
    badgeKey: "pendingPosts",
  },
];

export default function AdminDashboard() {
  const { user, token, loading } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!loading && user?.role !== "admin") {
      router.replace("/");
    }
  }, [loading, user]);

  useFocusEffect(
    useCallback(() => {
      if (user?.role !== "admin" || !token) return;
      fetchPendingPostsCount(token)
        .then((data) => setPendingCount(data.count))
        .catch(() => {});
    }, [user, token]),
  );

  if (loading || user?.role !== "admin") return null;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.brand}>Admin Dashboard</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {SECTIONS.map((section) => (
          <TouchableOpacity
            key={section.key}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => router.push(section.route)}
          >
            <View style={styles.cardIconBox}>
              <section.icon size={22} color={colors.chrome} strokeWidth={1.75} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.cardTitle}>{section.label}</Text>
              <Text style={styles.cardDescription}>{section.description}</Text>
            </View>
            {section.badgeKey === "pendingPosts" && pendingCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            ) : null}
            <ChevronRight size={18} color={colors.steel} />
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    color: colors.chrome,
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },

  content: { padding: 20, paddingBottom: 60, gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.onyxRaised,
    padding: 16,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.onyx,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  badgeText: { color: colors.void, fontSize: 12, fontWeight: "700" },
  cardTitle: { color: colors.chrome, fontSize: 15, fontWeight: "700" },
  cardDescription: {
    color: colors.steel,
    fontSize: 12.5,
    marginTop: 3,
    lineHeight: 17,
  },
});
