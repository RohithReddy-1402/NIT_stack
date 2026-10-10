const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function fetchPapers() {
  const response = await fetch(`${API_URL}/papers`);

  return await response.json();
}

/**
 * Resolves a paper's r2Key to a short-lived signed URL. The papers R2 bucket
 * is private now — the backend checks auth + premium/free-quota, then
 * redirects (302) to the Cloudflare Worker URL that actually streams the
 * file. `mode: "download"` sets the attachment disposition and counts
 * against the download quota; "view" is inline and doesn't.
 */
export async function getPaperAccessUrl(token, r2Key, mode = "view") {
  if (!token) {
    const error = new Error("Log in to view or download papers.");
    error.code = "LOGIN_REQUIRED";
    throw error;
  }
  const id = encodeURIComponent(r2Key.replace(/^papers\//, ""));
  const path = mode === "download" ? `/api/download/papers/${id}` : `/api/paper/view/${id}`;
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const error = new Error(body?.message || `Couldn't open that paper (${response.status})`);
    error.code = response.status === 403 ? body?.code : response.status === 401 ? "LOGIN_REQUIRED" : null;
    throw error;
  }
  return response.url;
}
