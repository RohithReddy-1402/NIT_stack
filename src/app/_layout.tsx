import HubSheet from "@/components/HubSheet";
import LiquidGlassTabBar from "@/components/NavTab";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { addNotificationResponseListener } from "@/services/pushNotifications";
import { emitTabReselect } from "@/utils/tabRefresh";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  router,
  usePathname,
} from "expo-router";
import { useEffect, useState } from "react";

// "hub" isn't a route — it opens HubSheet instead of navigating, which is
// what makes room for Syllabus, Internships/Opportunities, and Papers to
// live behind one tab instead of each needing their own slot.
const TABS = [
  { key: "/", label: "Home", icon: "home" as const },
  { key: "/forum", label: "Forum", icon: "forum" as const },
  { key: "hub", label: "Explore", icon: "hub" as const },
  { key: "/attendance", label: "Attend", icon: "attendance" as const },
  // Saved downloads stay reachable from Profile → Downloads.
  { key: "/profile", label: "Profile", icon: "profile" as const },
];

function RootLayoutNav() {
  const { isDark } = useTheme();
  const pathname = usePathname();
  const [hubOpen, setHubOpen] = useState(false);

  // Tabs are top-level routes, so the active tab is always just the first
  // path segment. Deriving it from the real pathname (instead of tracking a
  // separate "which tab did you last press" state) keeps the tab bar
  // permanently in sync with whatever screen is actually showing — including
  // when navigation happens some other way than pressing a tab.
  const activeKey = "/" + (pathname.split("/")[1] ?? "");

  // Deep-links a tapped notification (deadline reminder or push) straight to
  // its opportunity, from foreground, background, or a cold start alike.
  useEffect(() => addNotificationResponseListener((_id: string, slug?: string) => {
    if (slug) router.push(`/opportunities/${slug}` as any);
  }), []);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <ToastProvider>
          <>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            />
            <LiquidGlassTabBar
              tabs={TABS}
              activeKey={activeKey}
              onChange={(key) => {
                if (key === "hub") {
                  setHubOpen(true);
                  return;
                }
                if (key === activeKey) {
                  // `activeKey` only tracks the tab's top-level segment, so
                  // it also matches nested screens like
                  // /attendance/setup/subjects. Only treat this as a
                  // reselect (nothing to navigate to, let the screen refresh
                  // itself) when we're actually sitting on the tab's root —
                  // otherwise navigate back to that root screen.
                  if (pathname === key) {
                    emitTabReselect(key);
                  } else {
                    router.replace(key as any);
                  }
                  return;
                }
                // `replace` (not `push`) so switching tabs swaps the current
                // screen instead of piling up a new stack entry per switch —
                // that stacking was letting screens with expensive data
                // hooks (Attendance) accumulate multiple live instances.
                router.replace(key as any);
              }}
            />
            <HubSheet visible={hubOpen} onClose={() => setHubOpen(false)} />
          </>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootLayoutNav />
    </AppThemeProvider>
  );
}
