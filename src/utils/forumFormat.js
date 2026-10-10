import { formatDistanceToNowStrict } from "date-fns";

/** "now", "5m", "3h", "2d", "4mo", "1y" — compact like Reddit. */
export function timeAgo(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  if (Date.now() - d.getTime() < 60_000) return "now";
  const [n, unit] = formatDistanceToNowStrict(d).split(" ");
  const short = { second: "s", minute: "m", hour: "h", day: "d", month: "mo", year: "y" }[unit.replace(/s$/, "")];
  return `${n}${short}`;
}

/** 999 → "999", 1234 → "1.2k", 25300 → "25k". */
export function compactNumber(n) {
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  if (abs < 1000) return String(v);
  if (abs < 10_000) return `${(v / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  if (abs < 1_000_000) return `${Math.round(v / 1000)}k`;
  return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
}

export const plural = (n, word) => `${compactNumber(n)} ${word}${n === 1 ? "" : "s"}`;

/** Plain-text flattening of a rich post's sanitized HTML, for feed preview clamping. */
export function stripHtml(html) {
  return String(html || "")
    .replace(/<(p|br|div|li|h[1-6])[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}
