const API_URL = process.env.EXPO_PUBLIC_API_URL;
const BASE = `${API_URL}/api/forum`;

// Carries the HTTP status and the server's `code` (e.g. FORUM_PROFILE_REQUIRED)
// so screens can route to login/onboarding instead of just showing a toast.
export class ForumError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Reads are public, so `token` may be null; it's only sent when present.
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
    throw new ForumError("Can't reach the server — check your connection.", 0);
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ForumError(data.message || `Request failed (${response.status})`, response.status, data.code);
  }
  if (response.status === 204) return null;
  return await response.json();
}

const qs = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  return entries.length ? `?${new URLSearchParams(entries).toString()}` : "";
};
const enc = encodeURIComponent;

// ---------------------------------------------------------------- profile
export const fetchMyForumProfile = (token) => request("/me", token);
export const claimHandle = (token, handle) =>
  request("/me", token, { method: "POST", body: { handle, acceptTerms: true } });
export const updateMyForumProfile = (token, data) => request("/me", token, { method: "PATCH", body: data });
export const checkHandle = (token, handle, signal) => request(`/handles/available${qs({ h: handle })}`, token, { signal });
export const fetchUser = (token, handle) => request(`/users/${enc(handle)}`, token);
export const fetchUserPosts = (token, handle, params) => request(`/users/${enc(handle)}/posts${qs(params)}`, token);
export const fetchUserComments = (token, handle, params) => request(`/users/${enc(handle)}/comments${qs(params)}`, token);
export const blockUser = (token, handle) => request(`/users/${enc(handle)}/block`, token, { method: "POST" });
export const unblockUser = (token, handle) => request(`/users/${enc(handle)}/block`, token, { method: "DELETE" });
export const fetchBlocks = (token) => request("/me/blocks", token);
export const unblockRef = (token, ref) => request(`/me/blocks/ref/${enc(ref)}`, token, { method: "DELETE" });

// ------------------------------------------------------------ communities
export const fetchCommunities = (token, params) => request(`/communities${qs(params)}`, token);
export const fetchMyCommunities = (token) => request("/communities/mine", token);
export const fetchCommunity = (token, name) => request(`/communities/${enc(name)}`, token);
export const createCommunity = (token, data) => request("/communities", token, { method: "POST", body: data });
export const updateCommunity = (token, name, data) =>
  request(`/communities/${enc(name)}`, token, { method: "PATCH", body: data });
export const joinCommunity = (token, name) => request(`/communities/${enc(name)}/join`, token, { method: "POST" });
export const leaveCommunity = (token, name) => request(`/communities/${enc(name)}/join`, token, { method: "DELETE" });
export const fetchModerators = (token, name) => request(`/communities/${enc(name)}/moderators`, token);
export const addModerator = (token, name, handle) =>
  request(`/communities/${enc(name)}/moderators`, token, { method: "POST", body: { handle } });
export const fetchBans = (token, name) => request(`/communities/${enc(name)}/bans`, token);
export const unbanHandle = (token, name, handle) =>
  request(`/communities/${enc(name)}/bans/${enc(handle)}`, token, { method: "DELETE" });
export const unbanRef = (token, name, ref) =>
  request(`/communities/${enc(name)}/bans/ref/${enc(ref)}`, token, { method: "DELETE" });
export const fetchModQueue = (token, name, params) => request(`/communities/${enc(name)}/modqueue${qs(params)}`, token);
export const fetchModLog = (token, name, params) => request(`/communities/${enc(name)}/modlog${qs(params)}`, token);

// ------------------------------------------------------------------ feeds
// `source`: { type: "home" | "popular" | "community" | "user" | "saved", name?, handle? }
export const fetchFeed = (token, source, params) => {
  switch (source.type) {
    case "community":
      return request(`/communities/${enc(source.name)}/posts${qs(params)}`, token);
    case "user":
      return request(`/users/${enc(source.handle)}/posts${qs(params)}`, token);
    case "saved":
      return request(`/me/saved${qs(params)}`, token);
    case "popular":
      return request(`/feed/popular${qs(params)}`, token);
    default:
      return request(`/feed/home${qs(params)}`, token);
  }
};

// ------------------------------------------------------------------ posts
export const requestImageUpload = (token, contentType, bytes) =>
  request("/uploads/image-url", token, { method: "POST", body: { contentType, bytes } });
export const createPost = (token, data) => request("/posts", token, { method: "POST", body: data });
export const fetchPost = (token, id) => request(`/posts/${enc(id)}`, token);
export const editPost = (token, id, body) => request(`/posts/${enc(id)}`, token, { method: "PATCH", body: { body } });
export const deletePost = (token, id) => request(`/posts/${enc(id)}`, token, { method: "DELETE" });
export const votePost = (token, id, value) => request(`/posts/${enc(id)}/vote`, token, { method: "POST", body: { value } });
export const setPostSaved = (token, id, saved) =>
  request(`/posts/${enc(id)}/save`, token, { method: saved ? "POST" : "DELETE" });
export const setPostHidden = (token, id, hidden) =>
  request(`/posts/${enc(id)}/hide`, token, { method: hidden ? "POST" : "DELETE" });
export const blockPostAuthor = (token, id) => request(`/posts/${enc(id)}/block-author`, token, { method: "POST" });
export const reportContent = (token, type, id, reason, details) =>
  request(`/${type === "comment" ? "comments" : "posts"}/${enc(id)}/report`, token, {
    method: "POST",
    body: { reason, details },
  });

// Moderator actions: remove | approve | pin | unpin | lock | unlock | ban-author
export const moderate = (token, type, id, action, body) =>
  request(`/${type === "comment" ? "comments" : "posts"}/${enc(id)}/${action}`, token, { method: "POST", body: body ?? {} });

// ------------------------------------------------------------- site admin
// Posts awaiting approval in communities with `requiresApproval` — admins only.
export const fetchPendingPosts = (token, params) => request(`/admin/pending-posts${qs(params)}`, token);
export const fetchPendingPostsCount = (token) => request("/admin/pending-posts/count", token);
export const approvePendingPost = (token, id) => request(`/admin/pending-posts/${enc(id)}/approve`, token, { method: "POST" });
export const rejectPendingPost = (token, id, reason) =>
  request(`/admin/pending-posts/${enc(id)}/reject`, token, { method: "POST", body: { reason } });

// --------------------------------------------------------------- comments
export const fetchComments = (token, postId, params) => request(`/posts/${enc(postId)}/comments${qs(params)}`, token);
export const fetchReplies = (token, commentId, params) => request(`/comments/${enc(commentId)}/replies${qs(params)}`, token);
export const createComment = (token, postId, data) =>
  request(`/posts/${enc(postId)}/comments`, token, { method: "POST", body: data });
export const editComment = (token, id, body) => request(`/comments/${enc(id)}`, token, { method: "PATCH", body: { body } });
export const deleteComment = (token, id) => request(`/comments/${enc(id)}`, token, { method: "DELETE" });
export const voteComment = (token, id, value) =>
  request(`/comments/${enc(id)}/vote`, token, { method: "POST", body: { value } });
export const blockCommentAuthor = (token, id) => request(`/comments/${enc(id)}/block-author`, token, { method: "POST" });

// ----------------------------------------------------------------- search
export const search = (token, params, signal) => request(`/search${qs(params)}`, token, { signal });
export const suggest = (token, q, signal) => request(`/search/suggest${qs({ q })}`, token, { signal });

/** Absolute URL for avatar paths the API returns relative (`/api/profile/avatar/...`). */
export const absoluteUrl = (url) => (url && url.startsWith("/") ? `${API_URL}${url}` : url);
