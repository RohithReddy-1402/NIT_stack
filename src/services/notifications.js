import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Shared local-notification core used by every feature that schedules
// notifications (attendance reminders, opportunity deadline reminders).
// Centralizing this means `setNotificationHandler` is only ever set once,
// and cancellation can be scoped per-feature (see `cancelByPrefix`) instead
// of each feature wiping out every other feature's scheduled notifications.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureChannel(channelId, name) {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(channelId, {
    name,
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleLocal({ identifier, title, body, data, channelId, trigger }) {
  return Notifications.scheduleNotificationAsync({
    identifier,
    content: {
      title,
      body,
      data,
      ...(Platform.OS === "android" && channelId ? { channelId } : {}),
    },
    trigger,
  });
}

export async function cancelScheduled(identifier) {
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
}

/**
 * Cancels only the scheduled notifications whose identifier starts with
 * `prefix`. Each feature namespaces its identifiers (e.g. "attendance:",
 * "opportunity-reminder:") so features can reschedule their own batch
 * without touching notifications another feature scheduled.
 */
export async function cancelByPrefix(prefix) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const targets = scheduled.filter((n) => n.identifier?.startsWith(prefix));
  await Promise.all(targets.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}
