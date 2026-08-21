import { fetchSyllabus } from "@/services/syllabus";
import { useCallback, useEffect, useState } from "react";
export function useSyllabus() {
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSyllabus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchSyllabus();

      setSyllabus(data);
    } catch (err) {
      console.error("Failed to load syllabus:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSyllabus();
  }, [loadSyllabus]);
  return {
    syllabus: syllabus,
    loading,
    error,
    refetch: loadSyllabus,
  };
}
