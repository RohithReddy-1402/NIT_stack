import { useAuth } from "@/contexts/AuthContext";
import { useOpportunityGate } from "@/hooks/opportunities/useOpportunityGate";
import { fetchNotificationPreferences, updateNotificationPreferences } from "@/services/notificationPreferences";
import { registerForPush, unregisterForPush } from "@/services/pushNotifications";
import { useCallback, useEffect, useState } from "react";

const DEFAULT_PREFS = {
  channels: { inApp: true, push: false, email: false },
  categories: {
    newInternships: true,
    newPlacements: true,
    newResearch: false,
    newHackathons: false,
    newScholarships: false,
    deadlineReminders: true,
    branchMatch: true,
    batchMatch: true,
    skillsMatch: false,
  },
  matchFilters: { branches: [], batches: [], skills: [], companies: [], types: [] },
  expoPushToken: null,
};

export function useNotificationPreferences() {
  const { token, isLoggedIn } = useAuth();
  const { handleError } = useOpportunityGate();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!isLoggedIn) {
      setPrefs(DEFAULT_PREFS);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchNotificationPreferences(token);
      setPrefs({ ...DEFAULT_PREFS, ...data });
    } catch {
      setPrefs(DEFAULT_PREFS);
    } finally {
      setLoading(false);
    }
  }, [token, isLoggedIn]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (patch) => {
      const next = { ...prefs, ...patch };
      setPrefs(next);
      try {
        await updateNotificationPreferences(token, next);
      } catch (err) {
        setPrefs(prefs);
        handleError(err, "Couldn't save your notification settings");
        throw err;
      }
    },
    [token, prefs, handleError],
  );

  const setPushEnabled = useCallback(
    async (enabled) => {
      setBusy(true);
      try {
        if (enabled) {
          const expoPushToken = await registerForPush(token);
          if (!expoPushToken) {
            handleError({ message: "Notification permission was denied." }, "Couldn't enable push notifications");
            return;
          }
          await save({ channels: { ...prefs.channels, push: true }, expoPushToken });
        } else {
          await unregisterForPush(token, prefs.expoPushToken);
          await save({ channels: { ...prefs.channels, push: false }, expoPushToken: null });
        }
      } finally {
        setBusy(false);
      }
    },
    [token, prefs, save, handleError],
  );

  return { prefs, loading, busy, save, setPushEnabled, reload: load };
}
