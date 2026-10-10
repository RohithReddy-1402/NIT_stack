import { useAuth } from "@/contexts/AuthContext";
import {
  createSubject,
  deleteSubject,
  fetchSubjects,
  updateSubject,
} from "@/services/attendance";
import { useCallback, useEffect, useState } from "react";

export function useSubjects(semesterId) {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!token || !semesterId) {
      setSubjects([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setSubjects(await fetchSubjects(token, semesterId));
    } catch (err) {
      console.error("Failed to load subjects:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token, semesterId]);

  useEffect(() => {
    load();
  }, [load]);

  const addSubject = useCallback(
    async (data) => {
      const created = await createSubject(token, semesterId, data);
      setSubjects((prev) => [...prev, created]);
      return created;
    },
    [token, semesterId],
  );

  const editSubject = useCallback(
    async (id, data) => {
      const updated = await updateSubject(token, id, data);
      setSubjects((prev) => prev.map((s) => (s.id === id ? updated : s)));
      return updated;
    },
    [token],
  );

  const removeSubject = useCallback(
    async (id) => {
      await deleteSubject(token, id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    },
    [token],
  );

  return {
    subjects,
    loading,
    error,
    addSubject,
    editSubject,
    removeSubject,
    refetch: load,
  };
}
