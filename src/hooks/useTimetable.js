import { useAuth } from "@/contexts/AuthContext";
import {
  createTimetableSlot,
  deleteTimetableSlot,
  fetchTimetable,
  updateTimetableSlot,
} from "@/services/attendance";
import {
  getNotificationLeadMinutes,
  getNotificationsEnabled,
} from "@/services/attendanceStorage";
import { rescheduleAll } from "@/services/attendanceNotifications";
import { useCallback, useEffect, useState } from "react";

// `subjects` is the semester's subject list, used to resolve subject names
// for notification content and to build the id lookup rescheduleAll needs.
export function useTimetable(semesterId, subjects) {
  const { token } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!token || !semesterId) {
      setSlots([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setSlots(await fetchTimetable(token, semesterId));
    } catch (err) {
      console.error("Failed to load timetable:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token, semesterId]);

  useEffect(() => {
    load();
  }, [load]);

  const maybeReschedule = useCallback(
    async (nextSlots) => {
      const enabled = await getNotificationsEnabled();
      if (!enabled) return;
      const leadMinutes = await getNotificationLeadMinutes();
      const subjectsById = Object.fromEntries(
        (subjects ?? []).map((s) => [s.id, s]),
      );
      await rescheduleAll(nextSlots, subjectsById, leadMinutes);
    },
    [subjects],
  );

  const addSlot = useCallback(
    async (data) => {
      const created = await createTimetableSlot(token, semesterId, data);
      setSlots((prev) => {
        const next = [...prev, created];
        maybeReschedule(next);
        return next;
      });
      return created;
    },
    [token, semesterId, maybeReschedule],
  );

  const editSlot = useCallback(
    async (id, data) => {
      const updated = await updateTimetableSlot(token, id, data);
      setSlots((prev) => {
        const next = prev.map((s) => (s.id === id ? updated : s));
        maybeReschedule(next);
        return next;
      });
      return updated;
    },
    [token, maybeReschedule],
  );

  const removeSlot = useCallback(
    async (id) => {
      await deleteTimetableSlot(token, id);
      setSlots((prev) => {
        const next = prev.filter((s) => s.id !== id);
        maybeReschedule(next);
        return next;
      });
    },
    [token, maybeReschedule],
  );

  return { slots, loading, error, addSlot, editSlot, removeSlot, refetch: load };
}
