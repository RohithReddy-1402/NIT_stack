import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";

const THEME_STORAGE_KEY = "themePreference";

// Every screen previously hardcoded its own copy of this same palette, so
// this is the single canonical source both themes draw from. `chromeSecondary`
// is the gradient stop several screens used as a literal "#D8D8DD" next to
// `chrome` for glossy buttons/cards.
export const palettes = {
  dark: {
    void: "#0A0A0B",
    onyx: "#141416",
    onyxRaised: "#1C1C1F",
    chrome: "#F5F5F7",
    chromeSecondary: "#D8D8DD",
    silver: "#C9C9CE",
    steel: "#8E8E93",
    hairline: "#2C2C30",
    hairlineDim: "rgba(255,255,255,0.07)",
    glassFill: "rgba(255,255,255,0.05)",
    glassFillRaised: "rgba(255,255,255,0.08)",
    glossHi: "rgba(255,255,255,0.14)",
    glossLo: "rgba(255,255,255,0.02)",
    accent: "#8E8EFF",
    danger: "#FF453A",
    success: "#32D74B",
  },
  light: {
    void: "#F7F7F8",
    onyx: "#FFFFFF",
    onyxRaised: "#FFFFFF",
    chrome: "#0A0A0B",
    chromeSecondary: "#2C2C2E",
    silver: "#3C3C43",
    steel: "#6E6E73",
    hairline: "#E3E3E6",
    hairlineDim: "rgba(0,0,0,0.06)",
    glassFill: "rgba(0,0,0,0.03)",
    glassFillRaised: "rgba(0,0,0,0.05)",
    glossHi: "rgba(255,255,255,0.7)",
    glossLo: "rgba(255,255,255,0.1)",
    accent: "#5A5AF0",
    danger: "#D70015",
    success: "#248A3D",
  },
};

/** @type {import("react").Context<{ preference: string, resolvedTheme: string, isDark: boolean, colors: typeof palettes.dark, setThemePreference: (next: string) => void, toggleTheme: () => void } | null>} */
const ThemeContext = createContext(null);

export function AppThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState("system"); // "light" | "dark" | "system"

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === "light" || stored === "dark" || stored === "system") {
          setPreference(stored);
        }
      } catch (error) {
        console.error("Failed to load theme preference:", error);
      }
    })();
  }, []);

  const resolvedTheme =
    preference === "system" ? (systemScheme ?? "dark") : preference;
  const isDark = resolvedTheme !== "light";
  const colors = palettes[isDark ? "dark" : "light"];

  const setThemePreference = useCallback(async (next) => {
    setPreference(next);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (error) {
      console.error("Failed to persist theme preference:", error);
    }
  }, []);

  const toggleTheme = useCallback(
    () => setThemePreference(isDark ? "light" : "dark"),
    [isDark, setThemePreference],
  );

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      isDark,
      colors,
      setThemePreference,
      toggleTheme,
    }),
    [preference, resolvedTheme, isDark, colors, setThemePreference, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within AppThemeProvider");
  return ctx;
}
