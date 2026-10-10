// The API stores class times as 24-hour "HH:mm" strings; these convert to and
// from the Date the native clock picker works with, and to 12-hour display.

const pad = (n) => String(n).padStart(2, "0");

export function timeFromDate(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// With no time set, returns "now" — the clock dialog needs some starting
// position, but callers only store a value once the user confirms it.
export function dateFromTime(time) {
  const date = new Date();
  if (time) {
    const [hours, minutes] = time.split(":").map(Number);
    date.setHours(hours, minutes, 0, 0);
  }
  return date;
}

export function to12Hour(time) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${pad(minutes)} ${suffix}`;
}

// The attendance API rejects records and timetable slots that lack a
// startTime/endTime, but in the app times are optional. "No time" is therefore
// sent as this 00:00-00:00 placeholder and read back as empty. Once the
// backend accepts missing times, delete these two helpers and send the raw
// values (and stop calling fromApiTimes when reading).
const NO_TIME = "00:00";

export function toApiTimes(startTime, endTime) {
  if (!startTime && !endTime) return { startTime: NO_TIME, endTime: NO_TIME };
  // Only a start was chosen: the API still needs an end, so it mirrors the
  // start and fromApiTimes drops it again on the way back.
  return { startTime, endTime: endTime || startTime };
}

export function fromApiTimes(startTime, endTime) {
  if (!startTime || (startTime === NO_TIME && endTime === NO_TIME)) {
    return { startTime: null, endTime: null };
  }
  return {
    startTime,
    endTime: endTime && endTime !== startTime ? endTime : null,
  };
}

// "" when the class has no time, so callers can hide the label entirely.
// Accepts times exactly as the API returns them.
export function formatTimeRange(apiStartTime, apiEndTime) {
  const { startTime, endTime } = fromApiTimes(apiStartTime, apiEndTime);
  if (startTime && endTime) {
    return `${to12Hour(startTime)} – ${to12Hour(endTime)}`;
  }
  return startTime ? `From ${to12Hour(startTime)}` : "";
}

// Message to show when the chosen times can't be saved, else null.
// "HH:mm" strings compare correctly as plain text.
export function timeError(startTime, endTime) {
  if (endTime && !startTime) {
    return "Add a start time first, or clear the end time.";
  }
  if (startTime && endTime && endTime <= startTime) {
    return "End time must be after the start time.";
  }
  return null;
}
