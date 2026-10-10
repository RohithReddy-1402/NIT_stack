const API_URL = process.env.EXPO_PUBLIC_API_URL;
const BASE = `${API_URL}/api/notifications`;

async function request(path, token, { method = "GET", body } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  if (response.status === 204) return null;
  return await response.json();
}

const qs = (params = {}) => {
  const entries = Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== "");
  return entries.length ? `?${new URLSearchParams(entries).toString()}` : "";
};

export const fetchNotificationPreferences = (token) => request("/preferences", token);
export const updateNotificationPreferences = (token, data) => request("/preferences", token, { method: "PUT", body: data });

export const registerDeviceToken = (token, { expoPushToken, platform }) =>
  request("/devices", token, { method: "POST", body: { expoPushToken, platform } });
export const unregisterDeviceToken = (token, expoPushToken) =>
  request(`/devices/${encodeURIComponent(expoPushToken)}`, token, { method: "DELETE" });

export const fetchNotificationInbox = (token, params) => request(`/inbox${qs(params)}`, token);
export const markInboxRead = (token, id) => request(`/inbox/${encodeURIComponent(id)}/read`, token, { method: "POST" });
export const markAllInboxRead = (token) => request("/inbox/read-all", token, { method: "POST" });
