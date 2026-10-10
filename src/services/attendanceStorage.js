import AsyncStorage from "@react-native-async-storage/async-storage";

const ACTIVE_SEMESTER_KEY = "attendanceActiveSemesterId";
const LEAD_MINUTES_KEY = "attendanceLeadMinutes";
const ENABLED_KEY = "attendanceNotificationsEnabled";
const LAST_RESCHEDULED_KEY = "attendanceLastRescheduledDate";

const DEFAULT_LEAD_MINUTES = 10;

// Read-only: semesters are no longer user-selectable, but accounts that
// picked one earlier keep using it (see useAttendanceSemesters).
export async function getActiveSemesterId() {
  return await AsyncStorage.getItem(ACTIVE_SEMESTER_KEY);
}

export async function getNotificationLeadMinutes() {
  const stored = await AsyncStorage.getItem(LEAD_MINUTES_KEY);
  const parsed = stored ? parseInt(stored, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : DEFAULT_LEAD_MINUTES;
}

export async function setNotificationLeadMinutes(minutes) {
  await AsyncStorage.setItem(LEAD_MINUTES_KEY, String(minutes));
}

export async function getNotificationsEnabled() {
  return (await AsyncStorage.getItem(ENABLED_KEY)) === "true";
}

export async function setNotificationsEnabled(enabled) {
  await AsyncStorage.setItem(ENABLED_KEY, enabled ? "true" : "false");
}

export async function getLastRescheduledDate() {
  return await AsyncStorage.getItem(LAST_RESCHEDULED_KEY);
}

export async function setLastRescheduledDate(dateString) {
  await AsyncStorage.setItem(LAST_RESCHEDULED_KEY, dateString);
}
