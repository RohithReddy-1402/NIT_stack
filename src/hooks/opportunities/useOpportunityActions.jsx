import ActionSheet from "@/components/forum/ActionSheet";
import OpportunityReportSheet from "@/components/opportunities/OpportunityReportSheet";
import ReminderSheet from "@/components/opportunities/ReminderSheet";
import SuggestEditSheet from "@/components/opportunities/SuggestEditSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useOpportunityGate } from "@/hooks/opportunities/useOpportunityGate";
import { reportOpportunity, suggestEdit as suggestEditRequest, trackApplyClick } from "@/services/opportunities";
import { cancelReminder, requestPermission, scheduleReminder } from "@/services/opportunityNotifications";
import { getOpportunityState, toggleBookmark, updateReminder, useOpportunityState } from "@/services/opportunityStore";
import { copyLink, shareLink } from "@/services/forumShare";
import { Link2, Pencil, Share2 } from "lucide-react-native";
import { Linking } from "react-native";
import { useCallback, useState } from "react";

/**
 * All opportunity actions in one place, mirroring forum's usePostActions:
 * bookmark + deadline reminder, share, copy link, report, and the external
 * "Apply on Official Website" hand-off (never an internal apply flow).
 */
export function useOpportunityActions(opportunity) {
  const { token } = useAuth();
  const { addToast } = useToast();
  const { ensureAuth, handleError } = useOpportunityGate();
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [suggestEditOpen, setSuggestEditOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const live = useOpportunityState(opportunity);

  const share = useCallback(async () => {
    try {
      const result = await shareLink(opportunity.title, opportunity.shareUrl);
      if (result === "copied") addToast("Link copied", "success");
    } catch {
      addToast("Couldn't open the share sheet", "error");
    }
  }, [opportunity, addToast]);

  const copy = useCallback(async () => {
    await copyLink(opportunity.shareUrl);
    addToast("Link copied", "success");
  }, [opportunity, addToast]);

  const toggleSave = useCallback(async () => {
    if (!ensureAuth()) return;
    const wasBookmarked = getOpportunityState(opportunity.id)?.bookmarked ?? opportunity.bookmarked;
    const priorLead = getOpportunityState(opportunity.id)?.reminderLeadHours;
    try {
      await toggleBookmark(token, opportunity);
      if (wasBookmarked && priorLead) await cancelReminder(opportunity.id, priorLead);
      addToast(wasBookmarked ? "Removed from saved" : "Saved", "success");
    } catch (error) {
      handleError(error, "Couldn't update saved opportunities");
    }
  }, [opportunity, token, ensureAuth, handleError, addToast]);

  const openReminderPicker = useCallback(() => {
    if (!ensureAuth()) return;
    setReminderOpen(true);
  }, [ensureAuth]);

  const setReminder = useCallback(
    async (leadHours) => {
      setReminderOpen(false);
      const granted = await requestPermission();
      if (!granted) {
        addToast("Notification permission denied.", "error");
        return;
      }
      try {
        // "Remind me" implies bookmarked — save it first if it isn't already.
        if (!(getOpportunityState(opportunity.id)?.bookmarked ?? opportunity.bookmarked)) {
          await toggleBookmark(token, opportunity);
        }
        await updateReminder(token, opportunity, leadHours);
        await scheduleReminder(opportunity, leadHours);
        addToast("Reminder set", "success");
      } catch (error) {
        handleError(error, "Couldn't set a reminder");
      }
    },
    [opportunity, token, handleError, addToast],
  );

  // Never claim an external application was completed — this just opens the
  // official URL and records a click for the admin dashboard's "most clicked" stat.
  const applyOfficial = useCallback(async () => {
    try {
      await trackApplyClick(token, opportunity.id);
    } catch {
      // Non-fatal — still open the link even if the click couldn't be tracked.
    }
    const url = opportunity.links?.applicationUrl;
    if (url) await Linking.openURL(url);
  }, [opportunity, token]);

  const submitReport = useCallback(
    async (reason, details) => {
      try {
        await reportOpportunity(token, opportunity.id, reason, details);
        addToast("Thanks — we'll review it", "success");
      } catch (error) {
        handleError(error, "Couldn't send the report");
        throw error;
      }
    },
    [opportunity, token, handleError, addToast],
  );

  const openReport = useCallback(() => {
    if (!ensureAuth()) return;
    setReportOpen(true);
  }, [ensureAuth]);

  const submitSuggestion = useCallback(
    async (note) => {
      try {
        await suggestEditRequest(token, opportunity.id, { note });
        addToast("Thanks — an admin will review it", "success");
      } catch (error) {
        handleError(error, "Couldn't send that suggestion");
        throw error;
      }
    },
    [opportunity, token, handleError, addToast],
  );

  const openSuggestEdit = useCallback(() => {
    if (!ensureAuth()) return;
    setSuggestEditOpen(true);
  }, [ensureAuth]);

  const openMoreMenu = useCallback(() => setMoreMenuOpen(true), []);

  const moreMenuActions = opportunity
    ? [
        { key: "share", label: "Share", icon: Share2, onPress: share },
        { key: "copy", label: "Copy link", icon: Link2, onPress: copy },
        { key: "suggest", label: "Suggest an edit", icon: Pencil, onPress: openSuggestEdit },
      ]
    : [];

  const elements = opportunity ? (
    <>
      <ReminderSheet visible={reminderOpen} onSelect={setReminder} onClose={() => setReminderOpen(false)} />
      <OpportunityReportSheet visible={reportOpen} onSubmit={submitReport} onClose={() => setReportOpen(false)} />
      <SuggestEditSheet visible={suggestEditOpen} onSubmit={submitSuggestion} onClose={() => setSuggestEditOpen(false)} />
      <ActionSheet visible={moreMenuOpen} title={opportunity.title} actions={moreMenuActions} onClose={() => setMoreMenuOpen(false)} />
    </>
  ) : null;

  return {
    share, copy, toggleSave, openReminderPicker, applyOfficial, openReport, openMoreMenu, elements,
    bookmarked: live.bookmarked,
  };
}
