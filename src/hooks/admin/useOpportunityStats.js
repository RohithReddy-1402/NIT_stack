import { useAuth } from "@/contexts/AuthContext";
import { fetchAdminStats } from "@/services/opportunities";
import { useCallback, useEffect, useState } from "react";

/** Admin dashboard counters: total/active/expiring/drafts/scheduled/closed + most viewed/bookmarked/clicked. */
export function useOpportunityStats() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await fetchAdminStats(token));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, loading, error, reload: load };
}
