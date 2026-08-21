import LiquidGlassTabBar from "@/components/NavTab";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  router,
} from "expo-router";
import React from "react";
import { useColorScheme } from "react-native";
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [activeTab, setActiveTab] = React.useState({
    key: "Home",
    label: "Home",
    icon: "home",
  });
  const tabs = [
    {
      key: "/",
      label: "Home",
      icon: "home",
    },
    {
      key: "syllabus",
      label: "Explore",
      icon: "explore",
    },
    {
      key: "saved",
      label: "Saved",
      icon: "saved",
    },
    {
      key: "profile",
      label: "Profile",
      icon: "profile",
    },
  ];
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <ToastProvider>
          <>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            />
            <LiquidGlassTabBar
              tabs={tabs}
              activeKey={activeTab.key}
              onChange={(key) => {
                const tab = tabs.find((item) => item.key === key);
                if (tab) {
                  router.push(tab.key as any);
                  setActiveTab(tab);
                }
              }}
            />
          </>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
