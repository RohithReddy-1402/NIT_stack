import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useInfiniteList } from "@/hooks/forum/useInfiniteList";
import { fetchEditSuggestions, fetchReports, fetchVerificationLog, resolveEditSuggestion, resolveReport } from "@/services/opportunities";
import { useCallback } from "react";

/** Reported-opportunity queue for admins, mirroring forum's fetchModQueue/moderate pattern. */
export function useOpportunityReportsQueue() {
  const { token } = useAuth();
  const { addToast } = useToast();
  const list = useInfiniteList((cursor) => fetchReports(token, { cursor }), "opportunity-reports");

  const resolve = useCallback(
    async (report, action) => {
      try {
        await resolveReport(token, report.id, action);
        list.setItems((items) => items.filter((r) => r.id !== report.id));
        addToast("Report resolved", "success");
      } catch (error) {
        addToast(error?.message || "Couldn't resolve report", "error");
      }
    },
    [token, list, addToast],
  );

  return { ...list, resolve };
}

export function useVerificationLog(opportunityId) {
  const { token } = useAuth();
  const load = useCallback(() => fetchVerificationLog(token, opportunityId), [token, opportunityId]);
  return { load };
}

/** Student-submitted correction requests — the "suggest an edit" review queue. */
export function useEditSuggestionsQueue() {
  const { token } = useAuth();
  const { addToast } = useToast();
  const list = useInfiniteList((cursor) => fetchEditSuggestions(token, { cursor }), "opportunity-edit-suggestions");

  const resolve = useCallback(
    async (suggestion, action) => {
      try {
        await resolveEditSuggestion(token, suggestion.id, action);
        list.setItems((items) => items.filter((s) => s.id !== suggestion.id));
        addToast(action === "resolved" ? "Marked as resolved" : "Dismissed", "success");
      } catch (error) {
        addToast(error?.message || "Couldn't resolve that suggestion", "error");
      }
    },
    [token, list, addToast],
  );

  return { ...list, resolve };
}
