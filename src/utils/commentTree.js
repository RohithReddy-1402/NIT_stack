// Helpers for the nested `replies` trees the comments API returns.

/** Immutably applies `fn(node)` to the comment with `id`, wherever it is. */
export function updateComment(nodes, id, fn) {
  let changed = false;
  const next = nodes.map((node) => {
    if (node.id === id) {
      changed = true;
      return fn(node);
    }
    if (node.replies?.length) {
      const replies = updateComment(node.replies, id, fn);
      if (replies !== node.replies) {
        changed = true;
        return { ...node, replies };
      }
    }
    return node;
  });
  return changed ? next : nodes;
}

export function findComment(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    const hit = node.replies?.length ? findComment(node.replies, id) : null;
    if (hit) return hit;
  }
  return null;
}

// Replies deeper than this load via "Continue thread" (matches the API's inline depth).
export const INLINE_DEPTH = 6;

/**
 * Flattens the tree into FlatList rows, skipping collapsed subtrees:
 * { type: "comment", comment } and { type: "more", comment, count, continueThread }.
 */
export function flattenComments(nodes, collapsed) {
  const rows = [];
  const walk = (list) => {
    for (const c of list) {
      rows.push({ type: "comment", key: c.id, comment: c });
      if (collapsed.has(c.id)) continue;
      if (c.replies?.length) walk(c.replies);
      if (c.moreReplies > 0) {
        rows.push({
          type: "more",
          key: `more-${c.id}`,
          comment: c,
          count: c.moreReplies,
          continueThread: c.depth + 1 > INLINE_DEPTH && !c.replies?.length,
        });
      }
    }
  };
  walk(nodes);
  return rows;
}

/** Visible descendants of a comment (shown in the collapsed badge). */
export const countDescendants = (c) =>
  (c.replies || []).reduce((n, r) => n + 1 + countDescendants(r), 0) + (c.moreReplies || 0);
