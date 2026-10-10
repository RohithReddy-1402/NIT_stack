import { setBookmark, setBookmarkReminder } from "@/services/opportunities";
import { useCallback, useSyncExternalStore } from "react";

// Live per-opportunity state shared by every screen showing the same
// opportunity (feed card, detail page, saved list), so bookmarking on one
// screen is already reflected elsewhere — same pattern as forumStore.js.

const state = new Map(); // id → { bookmarked, reminderLeadHours, applicationStatus }
const listeners = new Map(); // id → Set<() => void>

const emit = (id) => listeners.get(id)?.forEach((fn) => fn());

/** Records server truth for freshly fetched opportunities. */
export function seedOpportunities(items) {
  for (const o of items) {
    if (!o) continue;
    const prev = state.get(o.id);
    const next = {
      bookmarked: o.bookmarked ?? false,
      reminderLeadHours: o.reminderLeadHours ?? null,
      applicationStatus: o.applicationStatus ?? null,
    };
    if (
      !prev ||
      prev.bookmarked !== next.bookmarked ||
      prev.reminderLeadHours !== next.reminderLeadHours ||
      prev.applicationStatus !== next.applicationStatus
    ) {
      state.set(o.id, next);
      emit(o.id);
    }
  }
}

export function patchOpportunity(id, patch) {
  const prev = state.get(id) ?? {};
  state.set(id, { ...prev, ...patch });
  emit(id);
}

export const getOpportunityState = (id) => state.get(id);

export function useOpportunityState(opportunity) {
  const id = opportunity?.id;
  const subscribe = useCallback(
    (fn) => {
      if (!listeners.has(id)) listeners.set(id, new Set());
      listeners.get(id).add(fn);
      return () => listeners.get(id)?.delete(fn);
    },
    [id],
  );
  const live = useSyncExternalStore(subscribe, () => state.get(id));
  return {
    bookmarked: live?.bookmarked ?? opportunity?.bookmarked ?? false,
    reminderLeadHours: live?.reminderLeadHours ?? opportunity?.reminderLeadHours ?? null,
    applicationStatus: live?.applicationStatus ?? opportunity?.applicationStatus ?? null,
  };
}

/** Optimistic bookmark toggle: updates immediately, reconciles with the server, rolls back on error. */
export async function toggleBookmark(token, opportunity) {
  const before = state.get(opportunity.id) ?? { bookmarked: opportunity.bookmarked ?? false };
  const next = !before.bookmarked;
  patchOpportunity(opportunity.id, { bookmarked: next, ...(next ? {} : { reminderLeadHours: null }) });
  try {
    await setBookmark(token, opportunity.id, next);
  } catch (error) {
    patchOpportunity(opportunity.id, before);
    throw error;
  }
}

/** Optimistic reminder change. Caller is responsible for (re)scheduling the local notification on success. */
export async function updateReminder(token, opportunity, leadHours) {
  const before = state.get(opportunity.id) ?? {};
  patchOpportunity(opportunity.id, { reminderLeadHours: leadHours });
  try {
    await setBookmarkReminder(token, opportunity.id, leadHours);
  } catch (error) {
    patchOpportunity(opportunity.id, before);
    throw error;
  }
}
