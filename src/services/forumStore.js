import { useCallback, useSyncExternalStore } from "react";
import { votePost } from "@/services/forum";

// Live per-post state shared by every screen showing the same post, so a vote
// cast on the post screen is already reflected when you go back to the feed
// (no refetch). Holds only what changes locally: score, myVote, saved,
// commentCount, and `gone` (hidden/deleted/blocked → drop from lists).

const state = new Map(); // id → { score, myVote, saved, commentCount, gone }
const listeners = new Map(); // id → Set<() => void>

const emit = (id) => listeners.get(id)?.forEach((fn) => fn());

/** Records server truth for freshly fetched posts. */
export function seedPosts(posts) {
  for (const p of posts) {
    if (!p) continue;
    const prev = state.get(p.id);
    const next = {
      score: p.score,
      myVote: p.myVote,
      saved: p.saved,
      commentCount: p.commentCount,
      gone: prev?.gone ?? false,
    };
    if (
      !prev ||
      prev.score !== next.score ||
      prev.myVote !== next.myVote ||
      prev.saved !== next.saved ||
      prev.commentCount !== next.commentCount
    ) {
      state.set(p.id, next);
      emit(p.id);
    }
  }
}

export function patchPost(id, patch) {
  const prev = state.get(id) ?? {};
  state.set(id, { ...prev, ...patch });
  emit(id);
}

export const getPostState = (id) => state.get(id);

/**
 * The live fields for one post, falling back to the post object itself.
 * (The snapshot is the stored object, which only changes on patch — so it's
 * stable, as useSyncExternalStore requires.)
 */
export function usePostState(post) {
  const id = post?.id;
  const subscribe = useCallback(
    (fn) => {
      if (!listeners.has(id)) listeners.set(id, new Set());
      listeners.get(id).add(fn);
      return () => listeners.get(id)?.delete(fn);
    },
    [id],
  );
  const live = useSyncExternalStore(subscribe, () => state.get(id));
  return {
    score: live?.score ?? post?.score ?? 0,
    myVote: live?.myVote ?? post?.myVote ?? 0,
    saved: live?.saved ?? post?.saved ?? false,
    commentCount: live?.commentCount ?? post?.commentCount ?? 0,
    gone: live?.gone ?? false,
  };
}

/** Optimistic vote: updates immediately, reconciles with the server, rolls back on error. */
export async function castPostVote(token, post, value) {
  const current = state.get(post.id) ?? { score: post.score, myVote: post.myVote };
  const before = { score: current.score, myVote: current.myVote };
  patchPost(post.id, { myVote: value, score: before.score + (value - before.myVote) });
  try {
    const result = await votePost(token, post.id, value);
    patchPost(post.id, { myVote: result.myVote, score: result.score });
  } catch (error) {
    patchPost(post.id, before);
    throw error;
  }
}
