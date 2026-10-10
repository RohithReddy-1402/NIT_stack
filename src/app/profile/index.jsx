import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { router } from "expo-router";
import {
  Bookmark,
  BookMarked,
  Briefcase,
  CalendarCheck,
  ChevronRight,
  ClipboardList,
  LogOut,
  Monitor,
  Moon,
  Shield,
  Sun,
  User,
} from "lucide-react-native";
import { useEffect, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user, isLoggedIn, loading, logout } = useAuth();
  const { addToast } = useToast();
  const { colors, preference, setThemePreference } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

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
    <SafeAreaView style={styles.screen} edges={["top"]}>
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
          <MenuRow
            icon={<CalendarCheck size={18} color={colors.chrome} strokeWidth={1.75} />}
            label="Attendance"
            subtitle="Track your classes and stats"
            onPress={() => router.push("attendance")}
          />
          <MenuRow
            icon={<Briefcase size={18} color={colors.chrome} strokeWidth={1.75} />}
            label="Opportunities"
            subtitle="Internships, placements, and more"
            onPress={() => router.push("/opportunities")}
          />
          <MenuRow
            icon={<Bookmark size={18} color={colors.chrome} strokeWidth={1.75} />}
            label="Saved opportunities"
            onPress={() => router.push("/opportunities/saved")}
          />
          <MenuRow
            icon={<ClipboardList size={18} color={colors.chrome} strokeWidth={1.75} />}
            label="My Applications"
            subtitle="Track opportunities you've applied to"
            onPress={() => router.push("/opportunities/applications")}
          />
          <MenuRow
            icon={<User size={18} color={colors.chrome} strokeWidth={1.75} />}
            label="Career Profile"
            subtitle="Branch, skills, and resume for better recommendations"
            onPress={() => router.push("/profile/career")}
          />
          {user?.role === "admin" && (
            <MenuRow
              icon={<Shield size={18} color={colors.chrome} strokeWidth={1.75} />}
              label="Admin Dashboard"
              subtitle="Verify papers and manage the app"
              onPress={() => router.push("admin")}
            />
          )}
          <MenuRow
            icon={<User size={18} color={colors.chrome} strokeWidth={1.75} />}
            label="About Us"
            onPress={() => router.push("about")}
          />
        </View>

        <View style={styles.themeSection}>
          <Text style={styles.themeSectionLabel}>Appearance</Text>
          <View style={styles.themeSwitcher}>
            <ThemeOption
              icon={Sun}
              label="Light"
              active={preference === "light"}
              onPress={() => setThemePreference("light")}
            />
            <ThemeOption
              icon={Moon}
              label="Dark"
              active={preference === "dark"}
              onPress={() => setThemePreference("dark")}
            />
            <ThemeOption
              icon={Monitor}
              label="System"
              active={preference === "system"}
              onPress={() => setThemePreference("system")}
            />
          </View>
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
    </SafeAreaView>
  );
}

const MenuRow = ({ icon, label, subtitle, onPress }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  return (
    <TouchableOpacity style={styles.menuRow} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.menuIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuLabel}>{label}</Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>
      <ChevronRight size={16} color={colors.steel} />
    </TouchableOpacity>
  );
};

const ThemeOption = ({ icon: Icon, label, active, onPress }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  return (
    <TouchableOpacity
      style={[styles.themeOption, active && styles.themeOptionActive]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <Icon
        size={16}
        color={active ? colors.void : colors.steel}
        strokeWidth={2}
      />
      <Text
        style={[
          styles.themeOptionText,
          active && styles.themeOptionTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.void },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
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

  themeSection: { marginBottom: 24 },
  themeSectionLabel: {
    color: colors.steel,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
    marginLeft: 4,
  },
  themeSwitcher: {
    flexDirection: "row",
    backgroundColor: colors.onyxRaised,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 4,
    gap: 4,
  },
  themeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  themeOptionActive: { backgroundColor: colors.chrome },
  themeOptionText: { color: colors.steel, fontSize: 12.5, fontWeight: "700" },
  themeOptionTextActive: { color: colors.void },

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
