import { cancelByPrefix, ensureChannel as ensureChannelCore, requestNotificationPermission } from "@/services/notifications";
import { formatTimeRange, fromApiTimes } from "@/utils/time";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const CHANNEL_ID = "attendance-reminders";
// Namespaces this feature's scheduled-notification identifiers so
// cancelByPrefix only ever touches attendance reminders, not opportunity
// deadline reminders (see src/services/opportunityNotifications.js) or any
// other feature that schedules local notifications.
const PREFIX = "attendance:";

async function ensureChannel() {
  await ensureChannelCore(CHANNEL_ID, "Class reminders");
}

export const requestPermission = requestNotificationPermission;

// TimetableSlot.dayOfWeek is 0-6 (Sun=0, matches Date.getDay()). expo-notifications
// weekly/calendar triggers use 1-7 (Sun=1), so shift by one.
function toExpoWeekday(dayOfWeek) {
  return dayOfWeek + 1;
}

function minutesBefore(time, leadMinutes) {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute - leadMinutes;
  const wrapped = ((total % 1440) + 1440) % 1440;
  return { hour: Math.floor(wrapped / 60), minute: wrapped % 60 };
}

// Weekly-recurring local notification per timetable slot, firing `leadMinutes`
// before the slot's startTime. Android supports a native WEEKLY trigger; iOS
// only exposes weekday/hour/minute recurrence via a repeating CALENDAR trigger.
async function scheduleSlot(slot, subjectName, leadMinutes) {
  const weekday = toExpoWeekday(slot.dayOfWeek);
  const { hour, minute } = minutesBefore(slot.startTime, leadMinutes);

  const trigger =
    Platform.OS === "android"
      ? {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour,
          minute,
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          weekday,
          hour,
          minute,
          repeats: true,
        };

  await Notifications.scheduleNotificationAsync({
    identifier: `${PREFIX}${slot.id}`,
    content: {
      title: `${subjectName} starts in ${leadMinutes} min`,
      body: formatTimeRange(slot.startTime, slot.endTime),
      ...(Platform.OS === "android" && { channelId: CHANNEL_ID }),
    },
    trigger,
  });
}

// Cancels this feature's scheduled notifications (only — see PREFIX) and
// recreates one per slot.
export async function rescheduleAll(timetableSlots, subjectsById, leadMinutes) {
  await ensureChannel();
  await cancelByPrefix(PREFIX);

  for (const slot of timetableSlots) {
    const subject = subjectsById[slot.subjectId];
    // A reminder "before class" needs a start time; untimed classes have none.
    if (!subject || !fromApiTimes(slot.startTime, slot.endTime).startTime) {
      continue;
    }
    await scheduleSlot(slot, subject.name, leadMinutes);
  }
}

export async function cancelAll() {
  await cancelByPrefix(PREFIX);
}
