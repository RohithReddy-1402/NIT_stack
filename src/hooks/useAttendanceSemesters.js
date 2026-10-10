import { useAuth } from "@/contexts/AuthContext";
import { createSemester, fetchSemesters } from "@/services/attendance";
import { getActiveSemesterId } from "@/services/attendanceStorage";
import { useCallback, useEffect, useState } from "react";

// Semesters are no longer something the user manages. The backend still
// scopes subjects, timetable and records under one, so the app keeps a single
// implicit semester behind the scenes and creates it on first use.
const DEFAULT_SEMESTER = { name: "My Attendance", type: "odd" };

// Several screens mount this hook at once. Sharing one in-flight
// fetch-or-create means a brand-new account gets exactly one default semester
// instead of one per screen.
let fetchOrCreateInFlight = null;

function fetchOrCreateSemesters(token) {
  if (!fetchOrCreateInFlight) {
    fetchOrCreateInFlight = (async () => {
      const semesters = await fetchSemesters(token);
      if (semesters.length > 0) return semesters;
      return [await createSemester(token, DEFAULT_SEMESTER)];
    })().finally(() => {
      fetchOrCreateInFlight = null;
    });
  }
  return fetchOrCreateInFlight;
}

// `create: false` is for screens (like Home) that only display attendance
// numbers and shouldn't create server data just by being opened.
export function useAttendanceSemesters({ create = true } = {}) {
  const { token } = useAuth();
  const [activeSemester, setActiveSemester] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const semesters = create
        ? await fetchOrCreateSemesters(token)
        : await fetchSemesters(token);

      // Accounts that already had several semesters keep using the one they
      // last selected, so their existing data stays visible.
      const cachedId = await getActiveSemesterId();
      setActiveSemester(
        semesters.find((s) => s.id === cachedId) ??
          semesters.find((s) => s.isActive) ??
          semesters[0] ??
          null,
      );
    } catch (err) {
      console.error("Failed to load semesters:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token, create]);

  useEffect(() => {
    load();
  }, [load]);

  return { activeSemester, loading, error, refetch: load };
}
