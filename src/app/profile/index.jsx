import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { router } from "expo-router";
import {
  BookMarked,
  ChevronRight,
  LogOut,
  Shield,
  User,
} from "lucide-react-native";
import { useEffect } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const colors = {
  void: "#0A0A0B",
  onyx: "#141416",
  onyxRaised: "#1C1C1F",
  chrome: "#F5F5F7",
  silver: "#C9C9CE",
  steel: "#8E8E93",
  hairline: "#2C2C30",
  accent: "#8E8EFF",
  danger: "#FF453A",
};

export default function ProfileScreen() {
  const { user, isLoggedIn, loading, logout } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [loading, isLoggedIn]);

  if (!isLoggedIn) return null;

  const handleLogout = async () => {
    await logout();
    addToast("Logged out successfully", "success");
    router.replace("/");
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {(user?.name || "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name || "Student"}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.role === "admin" && (
            <View style={styles.adminBadge}>
              <Shield size={12} color={colors.void} strokeWidth={2} />
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
        </View>

        <View style={styles.menu}>
          <MenuRow
            icon={<BookMarked size={18} color={colors.chrome} strokeWidth={1.75} />}
            label="Downloads"
            subtitle="Papers and syllabus saved in the app"
            onPress={() => router.push("saved")}
          />
          {user?.role === "admin" && (
            <MenuRow
              icon={<Shield size={18} color={colors.chrome} strokeWidth={1.75} />}
              label="Verify Papers"
              subtitle="Review pending contributions"
              onPress={() => router.push("verifyPaper")}
            />
          )}
          <MenuRow
            icon={<User size={18} color={colors.chrome} strokeWidth={1.75} />}
            label="About Us"
            onPress={() => router.push("about")}
          />
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.85}
          onPress={handleLogout}
        >
          <LogOut size={16} color={colors.danger} strokeWidth={2} />
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const MenuRow = ({ icon, label, subtitle, onPress }) => (
  <TouchableOpacity style={styles.menuRow} activeOpacity={0.8} onPress={onPress}>
    <View style={styles.menuIcon}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Text style={styles.menuLabel}>{label}</Text>
      {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
    </View>
    <ChevronRight size={16} color={colors.steel} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.void },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 56 : 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  brand: { color: colors.chrome, fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },

  content: { padding: 20 },
  identityCard: {
    alignItems: "center",
    backgroundColor: colors.onyxRaised,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingVertical: 32,
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.onyx,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarInitial: { color: colors.chrome, fontSize: 28, fontWeight: "800" },
  name: { color: colors.chrome, fontSize: 18, fontWeight: "700" },
  email: { color: colors.steel, fontSize: 13, marginTop: 4 },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 12,
  },
  adminBadgeText: { color: colors.void, fontSize: 11, fontWeight: "700" },

  menu: {
    backgroundColor: colors.onyxRaised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: "hidden",
    marginBottom: 24,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.onyx,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { color: colors.chrome, fontSize: 14.5, fontWeight: "700" },
  menuSubtitle: { color: colors.steel, fontSize: 12, marginTop: 2 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 14,
    paddingVertical: 14,
  },
  logoutText: { color: colors.danger, fontSize: 14, fontWeight: "700" },
});
