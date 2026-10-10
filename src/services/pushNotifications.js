import { requestNotificationPermission } from "@/services/notifications";
import { registerDeviceToken, unregisterDeviceToken } from "@/services/notificationPreferences";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Push notifications require a development/production build from SDK 53
// onward (unavailable in Expo Go on Android) — this app already builds via
// EAS (see eas.json), so that's covered.
const PROJECT_ID = Constants.expoConfig?.extra?.eas?.projectId;

/** Requests permission, gets an Expo push token, and registers it with the backend. Returns the token, or null if permission was denied. */
export async function registerForPush(authToken) {
  const granted = await requestNotificationPermission();
  if (!granted) return null;
  const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
  await registerDeviceToken(authToken, { expoPushToken, platform: Platform.OS });
  return expoPushToken;
}

export async function unregisterForPush(authToken, expoPushToken) {
  if (!expoPushToken) return;
  await unregisterDeviceToken(authToken, expoPushToken).catch(() => {});
}

/**
 * Deep-links a tapped notification (foreground, background, or cold start)
 * to its opportunity. Call once near the app root and keep the returned
 * unsubscribe for cleanup.
 */
export function addNotificationResponseListener(onOpenOpportunity) {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.opportunityId) onOpenOpportunity(data.opportunityId, data.slug);
  });
  return () => subscription.remove();
}
