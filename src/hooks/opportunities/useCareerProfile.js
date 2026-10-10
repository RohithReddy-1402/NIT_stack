import { useAuth } from "@/contexts/AuthContext";
import { useOpportunityGate } from "@/hooks/opportunities/useOpportunityGate";
import { fetchCareerProfile, updateCareerProfile } from "@/services/careerProfile";
import { useCallback, useEffect, useState } from "react";

const EMPTY_PROFILE = {
  branch: "",
  batch: "",
  graduationYear: "",
  semester: "",
  cgpa: "",
  skills: [],
  preferredLocations: [],
  preferredTypes: [],
  preferredCompanies: [],
};

/**
 * Optional "career profile" fields used for personalized recommendations.
 * Entirely opt-in — an empty profile is a valid state, not an error.
 */
export function useCareerProfile() {
  const { token, isLoggedIn } = useAuth();
  const { handleError } = useOpportunityGate();
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!isLoggedIn) {
      setProfile(EMPTY_PROFILE);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchCareerProfile(token);
      setProfile({ ...EMPTY_PROFILE, ...data });
    } catch {
      setProfile(EMPTY_PROFILE);
    } finally {
      setLoading(false);
    }
  }, [token, isLoggedIn]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (patch) => {
      setSaving(true);
      try {
        const next = { ...profile, ...patch };
        await updateCareerProfile(token, next);
        setProfile(next);
        return next;
      } catch (err) {
        handleError(err, "Couldn't save your career profile");
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [token, profile, handleError],
  );

  // Simple completeness indicator — not shown as a hard requirement anywhere,
  // just a nudge toward better recommendations.
  const completeness = Math.round(
    (["branch", "batch", "graduationYear", "cgpa"].filter((k) => profile[k]).length +
      (profile.skills?.length ? 1 : 0)) /
      5 *
      100,
  );

  return { profile, loading, saving, save, reload: load, completeness };
}
