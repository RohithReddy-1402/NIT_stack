import { router } from "expo-router";
import {
  ChevronDown,
  ChevronRight,
  KeyRound,
  Menu,
  User,
  X,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
const nextLogo = require("../../assets/icon.png");

const NAV_ITEMS = [
  { label: "Home", route: "/" },
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
  { label: "Donate", route: "donate" },
  { label: "Contact", route: "contact" },
];

export default function Header() {
  const { isLoggedIn } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [menuOpen, setMenuOpen] = useState(false); // replaces desktop/mobile hidden toggling
  const [aboutOpen, setAboutOpen] = useState(false); // replaces the group-hover dropdown

  const handleNavigation = (route) => {
    setMenuOpen(false);
    setAboutOpen(false);

    // Same stacking issue as the logo above — going "back to Home" from the
    // menu should replace, not push, another Home screen onto the stack.
    if (route === "/") router.replace("/");
    else router.push(route);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.topBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            // `push` here stacked a new Home screen on every tap — even
            // repeated taps while already on Home — so back/exit had to pop
            // through every duplicate before actually leaving. `replace`
            // matches how the bottom tab bar itself navigates to Home.
            setMenuOpen(false);
            setAboutOpen(false);
            router.replace("/");
          }}
          style={styles.logoWrap}
        >
          <Image source={nextLogo} style={styles.logo} resizeMode="contain" />
        </TouchableOpacity>

        <View style={styles.rightSection}>
          {!isLoggedIn && (
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
                onPress={() => router.push("signup")}
                style={styles.signUpBtn}
                activeOpacity={0.85}
              >
                <User size={15} color={colors.void} strokeWidth={2} />
                <Text style={styles.signUpBtnText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
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

const getStyles = (colors) =>
  StyleSheet.create({
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
    logo: { width: 60, height: 60, borderRadius: 10 },

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

    menuToggle: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },

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
