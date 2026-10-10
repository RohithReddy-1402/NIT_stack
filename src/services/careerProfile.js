const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Small, self-contained resource (not big enough to warrant forum.js's full
// request()/typed-error machinery) — mirrors papers.js's plain-fetch style,
// with the typed `.status`/`.code` error still attached for gate hooks.
async function request(path, token, { method = "GET", body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
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

export const fetchCareerProfile = (token) => request("/api/users/me/career-profile", token);
export const updateCareerProfile = (token, data) =>
  request("/api/users/me/career-profile", token, { method: "PUT", body: data });

export const fetchResumes = (token) => request("/api/users/me/resumes", token);
export const registerResume = (token, { key, filename, size }) =>
  request("/api/users/me/resume", token, { method: "POST", body: { key, filename, size } });
export const deleteResume = (token, id) => request(`/api/users/me/resume/${encodeURIComponent(id)}`, token, { method: "DELETE" });
