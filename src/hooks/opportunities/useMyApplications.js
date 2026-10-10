import { useAuth } from "@/contexts/AuthContext";
import { useOpportunityGate } from "@/hooks/opportunities/useOpportunityGate";
import { deleteApplication, fetchApplications, trackApplication, updateApplication } from "@/services/opportunities";
import { patchOpportunity } from "@/services/opportunityStore";
import { useCallback, useEffect, useState } from "react";

/** "My Applications" tracker: fully optional, self-reported status per opportunity. */
export function useMyApplications() {
  const { token, isLoggedIn } = useAuth();
  const { handleError } = useOpportunityGate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!isLoggedIn) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { items: apps } = await fetchApplications(token);
      setItems(apps);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token, isLoggedIn]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = useCallback(
    async (opportunityId, status) => {
      try {
        const app = await trackApplication(token, opportunityId, status);
        patchOpportunity(opportunityId, { applicationStatus: status });
        setItems((prev) => {
          const idx = prev.findIndex((a) => a.opportunityId === opportunityId);
          if (idx === -1) return [app, ...prev];
          const next = [...prev];
          next[idx] = app;
          return next;
        });
        return app;
      } catch (err) {
        handleError(err, "Couldn't update your application");
        throw err;
      }
    },
    [token, handleError],
  );

  const updateNotes = useCallback(
    async (applicationId, patch) => {
      try {
        const app = await updateApplication(token, applicationId, patch);
        setItems((prev) => prev.map((a) => (a.id === applicationId ? app : a)));
      } catch (err) {
        handleError(err, "Couldn't save your changes");
        throw err;
      }
    },
    [token, handleError],
  );

  const remove = useCallback(
    async (application) => {
      try {
        await deleteApplication(token, application.id);
        patchOpportunity(application.opportunityId, { applicationStatus: null });
        setItems((prev) => prev.filter((a) => a.id !== application.id));
      } catch (err) {
        handleError(err, "Couldn't remove that");
        throw err;
      }
    },
    [token, handleError],
  );

  return { items, loading, error, reload: load, setStatus, updateNotes, remove };
}
