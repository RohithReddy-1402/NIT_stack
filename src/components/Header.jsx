import { router } from "expo-router";
import {
  ChevronDown,
  ChevronRight,
  KeyRound,
  LogOut,
  Menu,
  User,
  X,
} from "lucide-react-native";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
const nextLogo = require("../../assets/icon.png");

const colors = {
  void: "#0A0A0B",
  onyx: "#141416",
  onyxRaised: "#1C1C1F",
  chrome: "#F5F5F7",
  silver: "#C9C9CE",
  steel: "#8E8E93",
  hairline: "#2C2C30",
  glossHi: "rgba(255,255,255,0.10)",
};
const NAV_ITEMS = [
  { label: "Home", route: "Home" },
  {
    label: "About Us",
    route: "About",
    children: [
      { label: "Our Team", route: "AboutTeam" },
      { label: "Mission", route: "AboutMission" },
      { label: "History", route: "AboutHistory" },
    ],
  },
  { label: "Question Papers", route: "papers" },
  { label: "Syllabus", route: "syllabus" },
  { label: "Course Scheme", route: "Events" },
  { label: "Donate", route: "Donate" },
  { label: "Contact", route: "Contact" },
];

export default function Header({
  isLoggedIn,
  user,
  onLoginClick,
  onLogin,
  onLogout,
  onSignUpClick,
}) {
  const [menuOpen, setMenuOpen] = useState(false); // replaces desktop/mobile hidden toggling
  const [aboutOpen, setAboutOpen] = useState(false); // replaces the group-hover dropdown
  const [avatarOpen, setAvatarOpen] = useState(false); // replaces dropdownRef + handleiconclick

  const handleiconclick = () => setAvatarOpen((v) => !v); // same name/purpose as before

  const handleNavigation = (route) => {
    setMenuOpen(false);
    setAboutOpen(false);

    router.push(route);
  };

  const handleSignOut = () => {
    setAvatarOpen(false);
    onLogout();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.topBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleNavigation("Home")}
          style={styles.logoWrap}
        >
          <Image source={nextLogo} style={styles.logo} resizeMode="contain" />
        </TouchableOpacity>

        <View style={styles.rightSection}>
          {!isLoggedIn ? (
            <View style={styles.authRow}>
              <TouchableOpacity
                onPress={() => router.push("login")}
                style={styles.loginBtn}
                activeOpacity={0.85}
              >
                <KeyRound size={15} color={colors.chrome} strokeWidth={2} />
                <Text style={styles.loginBtnText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onSignUpClick}
                style={styles.signUpBtn}
                activeOpacity={0.85}
              >
                <User size={15} color={colors.void} strokeWidth={2} />
                <Text style={styles.signUpBtnText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleiconclick}
              activeOpacity={0.85}
              style={styles.avatarBtn}
            >
              <Text style={styles.avatarInitial}>
                {(user?.name || "U").charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setMenuOpen((v) => !v)}
            style={styles.menuToggle}
            activeOpacity={0.8}
          >
            {menuOpen ? (
              <X size={22} color={colors.chrome} strokeWidth={2} />
            ) : (
              <Menu size={22} color={colors.chrome} strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Avatar dropdown — replaces the ref-toggled "hidden" panel */}
      {avatarOpen && isLoggedIn && (
        <View style={styles.avatarPanel}>
          <View style={styles.avatarPanelHeader}>
            <Text style={styles.avatarName}>{user?.name}</Text>
            <Text style={styles.avatarEmail} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
          <View style={styles.hr} />
          <TouchableOpacity style={styles.avatarMenuRow} activeOpacity={0.7}>
            <Text style={styles.avatarMenuText}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarMenuRow} activeOpacity={0.7}>
            <Text style={styles.avatarMenuText}>Settings</Text>
          </TouchableOpacity>
          <View style={styles.hr} />
          <TouchableOpacity
            style={styles.avatarMenuRow}
            activeOpacity={0.7}
            onPress={handleSignOut}
          >
            <LogOut size={14} color="#FF453A" strokeWidth={2} />
            <Text
              style={[
                styles.avatarMenuText,
                { color: "#FF453A", marginLeft: 8 },
              ]}
            >
              Sign out
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Nav menu — slides down in place of the old lg:flex row / mobile block */}
      {menuOpen && (
        <ScrollView style={styles.navPanel} bounces={false}>
          {NAV_ITEMS.map((item) =>
            item.children ? (
              <View key={item.route}>
                <TouchableOpacity
                  style={styles.navRow}
                  activeOpacity={0.7}
                  onPress={() => setAboutOpen((v) => !v)}
                >
                  <Text style={styles.navRowText}>{item.label}</Text>
                  {aboutOpen ? (
                    <ChevronDown size={16} color={colors.steel} />
                  ) : (
                    <ChevronRight size={16} color={colors.steel} />
                  )}
                </TouchableOpacity>
                {aboutOpen &&
                  item.children.map((child) => (
                    <TouchableOpacity
                      key={child.route}
                      style={styles.navSubRow}
                      activeOpacity={0.7}
                      onPress={() => handleNavigation(child.route)}
                    >
                      <Text style={styles.navSubRowText}>{child.label}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            ) : (
              <TouchableOpacity
                key={item.route}
                style={styles.navRow}
                activeOpacity={0.7}
                onPress={() => handleNavigation(item.route)}
              >
                <Text style={styles.navRowText}>{item.label}</Text>
              </TouchableOpacity>
            ),
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.void,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    zIndex: 50,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    paddingHorizontal: 16,
  },
  logoWrap: { flexDirection: "row", alignItems: "center" },
  logo: { width: 92, height: 26 },

  rightSection: { flexDirection: "row", alignItems: "center", gap: 10 },

  authRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.onyxRaised,
  },
  loginBtnText: { color: colors.chrome, fontSize: 13, fontWeight: "700" },
  signUpBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.chrome,
  },
  signUpBtnText: { color: colors.void, fontSize: 13, fontWeight: "700" },

  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.onyxRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { color: colors.chrome, fontWeight: "700", fontSize: 14 },

  menuToggle: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarPanel: {
    position: "absolute",
    top: 64,
    right: 16,
    width: 220,
    backgroundColor: colors.onyxRaised,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 60,
  },
  avatarPanelHeader: { paddingHorizontal: 14, paddingBottom: 8 },
  avatarName: { color: colors.chrome, fontWeight: "700", fontSize: 14 },
  avatarEmail: { color: colors.steel, fontSize: 12, marginTop: 2 },
  hr: { height: 1, backgroundColor: colors.hairline, marginVertical: 4 },
  avatarMenuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  avatarMenuText: { color: colors.silver, fontSize: 13.5, fontWeight: "500" },

  navPanel: {
    maxHeight: 420,
    backgroundColor: colors.void,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingVertical: 6,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  navRowText: { color: colors.chrome, fontSize: 15.5, fontWeight: "600" },
  navSubRow: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: colors.onyx,
  },
  navSubRowText: { color: colors.silver, fontSize: 14 },
});
