import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cursor-paginated list: `fetchPage(cursor)` resolves to the API's
 * `{ items, hasMore, nextCursor, ...extra }`. `extra` keeps first-page
 * metadata (e.g. pinned posts, feed source). Responses from a superseded
 * request (sort changed mid-flight) are ignored. `key` changes reload it.
 */
export function useInfiniteList(fetchPage, key, { enabled = true, onPage } = {}) {
  const [items, setItems] = useState([]);
  const [extra, setExtra] = useState({});
  const [status, setStatus] = useState(enabled ? "loading" : "idle"); // loading | refreshing | ready | error | idle
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const cursor = useRef(null);
  const requestId = useRef(0);
  const latestFetch = useRef(fetchPage);
  const latestOnPage = useRef(onPage);

  useEffect(() => {
    latestFetch.current = fetchPage;
    latestOnPage.current = onPage;
  });

  // A new key (sort/source changed) resets the list during render — React's
  // recommended way to reset state on prop change — so the effect below only
  // has to start the fetch.
  const identity = `${key}|${enabled}`;
  const [trackedIdentity, setTrackedIdentity] = useState(identity);
  if (trackedIdentity !== identity) {
    setTrackedIdentity(identity);
    setStatus(enabled ? "loading" : "idle");
    setItems([]);
    setExtra({});
    setHasMore(false);
    setError(null);
  }

  // Fetches page 1. State is only set after the response, never synchronously.
  const fetchFirst = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const page = await latestFetch.current(null);
      if (id !== requestId.current) return;
      const { items: first, hasMore: more, nextCursor, ...rest } = page;
      latestOnPage.current?.(first, rest);
      cursor.current = nextCursor;
      setItems(first);
      setExtra(rest);
      setHasMore(more);
      setError(null);
      setStatus("ready");
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (enabled) fetchFirst();
  }, [identity, enabled, fetchFirst]);

  const refresh = useCallback(() => {
    setStatus("refreshing");
    return fetchFirst();
  }, [fetchFirst]);

  const reload = useCallback(() => {
    setStatus("loading");
    return fetchFirst();
  }, [fetchFirst]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || status !== "ready") return;
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const page = await latestFetch.current(cursor.current);
      if (id !== requestId.current) return;
      latestOnPage.current?.(page.items, {});
      cursor.current = page.nextCursor;
      setHasMore(page.hasMore);
      // De-dupe: hot ranks can shift between pages.
      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id ?? x.name ?? x.handle));
        return [...prev, ...page.items.filter((x) => !seen.has(x.id ?? x.name ?? x.handle))];
      });
    } catch (err) {
      if (id === requestId.current) setError(err);
    } finally {
      if (id === requestId.current) setLoadingMore(false);
    }
  }, [hasMore, loadingMore, status]);

  return {
    items,
    setItems,
    extra,
    loading: status === "loading",
    refreshing: status === "refreshing",
    loadingMore,
    error,
    failed: status === "error",
    hasMore,
    refresh,
    reload,
    loadMore,
  };
}
