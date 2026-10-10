import { useAuth } from "@/contexts/AuthContext";
import { fetchStats } from "@/services/attendance";
import { useCallback, useEffect, useState } from "react";

export function useAttendanceStats(semesterId) {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!token || !semesterId) {
      setStats(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setStats(await fetchStats(token, semesterId));
    } catch (err) {
      console.error("Failed to load attendance stats:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token, semesterId]);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, loading, error, refetch: load };
}
