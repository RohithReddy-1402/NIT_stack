import { cancelByPrefix, cancelScheduled, ensureChannel, requestNotificationPermission, scheduleLocal } from "@/services/notifications";
import * as Notifications from "expo-notifications";

const CHANNEL_ID = "opportunity-reminders";
const PREFIX = "opportunity-reminder:";
const LEAD_LABELS = { 24: "24 hours", 72: "3 days", 168: "7 days" };

async function ensure() {
  await ensureChannel(CHANNEL_ID, "Deadline reminders");
}

export const requestPermission = requestNotificationPermission;

const reminderId = (opportunityId, leadHours) => `${PREFIX}${opportunityId}:${leadHours}`;

/**
 * Schedules a one-off local reminder `leadHours` before the deadline — no
 * server round-trip needed since the deadline is already on the client.
 * A no-op if that moment has already passed.
 */
export async function scheduleReminder(opportunity, leadHours) {
  const deadline = new Date(opportunity.applicationDeadline).getTime();
  if (Number.isNaN(deadline)) return;
  const fireAt = deadline - leadHours * 60 * 60 * 1000;
  if (fireAt <= Date.now()) return;

  await ensure();
  await scheduleLocal({
    identifier: reminderId(opportunity.id, leadHours),
    title: "Deadline approaching",
    body: `${opportunity.title}${opportunity.company?.name ? ` — ${opportunity.company.name}` : ""}: deadline in ${LEAD_LABELS[leadHours] ?? `${leadHours}h`}`,
    data: { type: "opportunity-deadline", opportunityId: opportunity.id, slug: opportunity.slug },
    channelId: CHANNEL_ID,
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(fireAt) },
  });
}

export async function cancelReminder(opportunityId, leadHours) {
  await cancelScheduled(reminderId(opportunityId, leadHours));
}

/** Re-syncs every reminder from the current bookmark list, e.g. after login. */
export async function rescheduleAllReminders(bookmarks) {
  await ensure();
  await cancelByPrefix(PREFIX);
  for (const bookmark of bookmarks) {
    if (bookmark.reminderLeadHours) {
      await scheduleReminder(bookmark, bookmark.reminderLeadHours);
    }
  }
}

export async function cancelAllReminders() {
  await cancelByPrefix(PREFIX);
}
