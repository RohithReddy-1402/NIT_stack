import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useInfiniteList } from "@/hooks/forum/useInfiniteList";
import {
  archiveOpportunity,
  createOpportunity,
  deleteOpportunity,
  duplicateOpportunity,
  fetchAdminOpportunities,
  fetchAdminOpportunity,
  publishOpportunity,
  setOpportunityFlags,
  setOpportunityStatus,
  unpublishOpportunity,
  updateOpportunity,
  verifyOpportunity,
} from "@/services/opportunities";
import { useCallback } from "react";

/** Admin list + CRUD/workflow actions, reusing useInfiniteList for the (large, filterable) admin table. */
export function useAdminOpportunities(filters) {
  const { token } = useAuth();
  const { addToast } = useToast();
  const key = `admin|${JSON.stringify(filters)}`;
  const list = useInfiniteList((cursor) => fetchAdminOpportunities(token, { ...filters, cursor }), key);

  const run = useCallback(
    async (fn, successMessage) => {
      try {
        const result = await fn();
        if (successMessage) addToast(successMessage, "success");
        return result;
      } catch (error) {
        addToast(error?.message || "Action failed", "error");
        throw error;
      }
    },
    [addToast],
  );

  return {
    ...list,
    create: (data) => run(() => createOpportunity(token, data), "Opportunity created"),
    update: (id, data) => run(() => updateOpportunity(token, id, data), "Saved"),
    remove: (id) =>
      run(() => deleteOpportunity(token, id), "Deleted").then(() => list.setItems((items) => items.filter((o) => o.id !== id))),
    duplicate: (id) => run(() => duplicateOpportunity(token, id), "Duplicated"),
    publish: (id, scheduledAt) =>
      run(() => publishOpportunity(token, id, scheduledAt), scheduledAt ? "Scheduled" : "Published"),
    unpublish: (id) => run(() => unpublishOpportunity(token, id), "Unpublished"),
    archive: (id) => run(() => archiveOpportunity(token, id), "Archived"),
    setStatus: (id, status) => run(() => setOpportunityStatus(token, id, status), "Status updated"),
    setFlags: (id, flags) => run(() => setOpportunityFlags(token, id, flags)),
    verify: (id, status) => run(() => verifyOpportunity(token, id, status), "Verification updated"),
  };
}

export function useAdminOpportunity(id) {
  const { token } = useAuth();
  const load = useCallback(() => fetchAdminOpportunity(token, id), [token, id]);
  return { load };
}
