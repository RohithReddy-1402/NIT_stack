import { useCallback, useEffect, useState } from "react";
import { fetchPapers } from "../services/papers";

export function usePapers() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPapers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchPapers();

      setPapers(data);
    } catch (err) {
      console.error("Failed to load papers:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPapers();
  }, [loadPapers]);
  return {
    questionPapers: papers,
    loading,
    error,
    refetch: loadPapers,
  };
}
