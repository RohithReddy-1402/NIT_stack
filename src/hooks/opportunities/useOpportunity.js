import { useAuth } from "@/contexts/AuthContext";
import { fetchOpportunity, trackOpportunityView } from "@/services/opportunities";
import { seedOpportunities } from "@/services/opportunityStore";
import { useCallback, useEffect, useState } from "react";

/** Single opportunity by slug, plus its related opportunities. Records a view once loaded. */
export function useOpportunity(slug) {
  const { token } = useAuth();
  const [opportunity, setOpportunity] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOpportunity(token, slug);
      setOpportunity(data);
      setRelated(data.relatedOpportunities ?? []);
      seedOpportunities([data, ...(data.relatedOpportunities ?? [])]);
      trackOpportunityView(token, data.id);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token, slug]);

  useEffect(() => {
    load();
  }, [load]);

  return { opportunity, related, loading, error, reload: load };
}
