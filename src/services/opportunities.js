const API_URL = process.env.EXPO_PUBLIC_API_URL;
const BASE = `${API_URL}/api/opportunities`;

// Carries the HTTP status and the server's `code` so screens can branch
// (e.g. route to login) instead of just showing a toast — same shape as
// forum.js's ForumError.
export class OpportunityError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Browsing is public, so `token` may be null; it's only sent when present.
async function request(path, token, { method = "GET", body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      signal,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new OpportunityError("Can't reach the server — check your connection.", 0);
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new OpportunityError(data.message || `Request failed (${response.status})`, response.status, data.code);
  }
  if (response.status === 204) return null;
  return await response.json();
}

const qs = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  return entries.length ? `?${new URLSearchParams(entries).toString()}` : "";
};
const enc = encodeURIComponent;

// ------------------------------------------------------------------ feed
// `source`: { type: "all" | "recommended" | "saved" | "company", name? }
export const fetchOpportunitiesFeed = (token, source = { type: "all" }, params, signal) => {
  switch (source.type) {
    case "recommended":
      return request(`/feed/recommended${qs(params)}`, token, { signal });
    case "saved":
      return request(`/bookmarks${qs(params)}`, token, { signal });
    case "company":
      return request(`/companies/${enc(source.name)}/opportunities${qs(params)}`, token, { signal });
    default:
      return request(`/feed${qs(params)}`, token, { signal });
  }
};
export const fetchOpportunity = (token, slug, signal) => request(`/${enc(slug)}`, token, { signal });
export const fetchOpportunitySuggestions = (token, q, signal) => request(`/suggest${qs({ q })}`, token, { signal });

// --------------------------------------------------------------- tracking
// Fire-and-forget view counter — never worth surfacing an error toast for.
export const trackOpportunityView = (token, id) => request(`/${enc(id)}/view`, token, { method: "POST" }).catch(() => {});
export const trackApplyClick = (token, id) => request(`/${enc(id)}/click-apply`, token, { method: "POST" });

// -------------------------------------------------------------- bookmarks
export const fetchBookmarks = (token, params) => request(`/bookmarks${qs(params)}`, token);
export const setBookmark = (token, id, bookmarked) =>
  request(`/${enc(id)}/bookmark`, token, { method: bookmarked ? "POST" : "DELETE" });
export const setBookmarkReminder = (token, id, leadHours) =>
  request(`/${enc(id)}/bookmark/reminder`, token, { method: "PUT", body: { leadHours } });

// ----------------------------------------------------------------- report
export const reportOpportunity = (token, id, reason, details) =>
  request(`/${enc(id)}/report`, token, { method: "POST", body: { reason, details } });

// ------------------------------------------------------------ applications
export const fetchApplications = (token, params) => request(`/applications${qs(params)}`, token);
export const trackApplication = (token, opportunityId, status) =>
  request(`/${enc(opportunityId)}/application`, token, { method: "POST", body: { status } });
export const updateApplication = (token, applicationId, patch) =>
  request(`/applications/${enc(applicationId)}`, token, { method: "PATCH", body: patch });
export const deleteApplication = (token, applicationId) =>
  request(`/applications/${enc(applicationId)}`, token, { method: "DELETE" });

// ----------------------------------------------------------------- uploads
// `purpose`: "opportunity-logo" | "opportunity-attachment" | "resume" — one
// generic presign endpoint instead of one per feature (forum has a dedicated
// /uploads/image-url; this covers three upload kinds behind a discriminator).
export const presignUpload = (token, purpose, contentType) =>
  request(`/uploads/presign`, token, { method: "POST", body: { purpose, contentType } });

// --------------------------------------------------------- student submission
// A student-authored posting — saved as a pending draft for an admin to
// review and publish (or reject). Distinct from createOpportunity, which is
// the admin-only direct-create under /admin (auto-verified, no review step).
export const submitOpportunity = (token, data) => request(`/submit`, token, { method: "POST", body: data });

// Correction requests on an already-published opportunity — the admin reviews
// the note and applies the fix themselves via the normal edit screen, rather
// than an auto-merge (keeps a wrong suggestion from silently going live).
export const suggestEdit = (token, id, { note, changes }) =>
  request(`/${enc(id)}/suggest-edit`, token, { method: "POST", body: { note, changes } });
export const fetchEditSuggestions = (token, params) => request(`/admin/edit-suggestions${qs(params)}`, token);
export const resolveEditSuggestion = (token, id, action) =>
  request(`/admin/edit-suggestions/${enc(id)}/resolve`, token, { method: "POST", body: { action } });

// ------------------------------------------------------------------ admin
export const fetchAdminOpportunities = (token, params) => request(`/admin${qs(params)}`, token);
export const fetchAdminOpportunity = (token, id) => request(`/admin/${enc(id)}`, token);
export const createOpportunity = (token, data) => request(`/admin`, token, { method: "POST", body: data });
export const updateOpportunity = (token, id, data) => request(`/admin/${enc(id)}`, token, { method: "PUT", body: data });
export const deleteOpportunity = (token, id) => request(`/admin/${enc(id)}`, token, { method: "DELETE" });
export const duplicateOpportunity = (token, id) => request(`/admin/${enc(id)}/duplicate`, token, { method: "POST" });
export const publishOpportunity = (token, id, scheduledAt) =>
  request(`/admin/${enc(id)}/publish`, token, { method: "POST", body: { scheduledAt } });
export const unpublishOpportunity = (token, id) => request(`/admin/${enc(id)}/unpublish`, token, { method: "POST" });
export const archiveOpportunity = (token, id) => request(`/admin/${enc(id)}/archive`, token, { method: "POST" });
export const setOpportunityStatus = (token, id, status) =>
  request(`/admin/${enc(id)}/status`, token, { method: "PUT", body: { status } });
export const setOpportunityFlags = (token, id, flags) =>
  request(`/admin/${enc(id)}/flags`, token, { method: "PUT", body: flags });
export const verifyOpportunity = (token, id, status) =>
  request(`/admin/${enc(id)}/verify`, token, { method: "POST", body: { status } });
export const fetchVerificationLog = (token, id) => request(`/admin/${enc(id)}/verification-log`, token);
export const fetchReports = (token, params) => request(`/admin/reports${qs(params)}`, token);
export const resolveReport = (token, id, action) =>
  request(`/admin/reports/${enc(id)}/resolve`, token, { method: "POST", body: { action } });
export const fetchAdminStats = (token) => request(`/admin/stats`, token);
