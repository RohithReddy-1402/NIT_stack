import { OPPORTUNITY_STATUS } from "@/constants/opportunities";

const DAY_MS = 24 * 60 * 60 * 1000;

/** "Deadline in 2 days" / "Deadline tomorrow" / "Deadline today" / "Applications closed". */
export function relativeDeadlineLabel(deadline) {
  if (!deadline) return "";
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return "";
  const diff = d.getTime() - Date.now();
  if (diff <= 0) return "Applications closed";
  const days = Math.ceil(diff / DAY_MS);
  if (days <= 1) return days === 0 ? "Deadline today" : "Deadline tomorrow";
  return `Deadline in ${days} days`;
}

/**
 * The backend auto-closes past-deadline opportunities on a schedule, which
 * can lag behind the actual deadline. Re-derive the display status from the
 * deadline itself so a student never sees a stale "Open" after it's passed.
 */
export function deriveDisplayStatus(opportunity) {
  if (!opportunity) return null;
  const { status, applicationDeadline } = opportunity;
  if (status === OPPORTUNITY_STATUS.CANCELLED || status === OPPORTUNITY_STATUS.CLOSED) return status;
  if (applicationDeadline) {
    const deadline = new Date(applicationDeadline).getTime();
    if (!Number.isNaN(deadline)) {
      if (deadline <= Date.now()) return OPPORTUNITY_STATUS.CLOSED;
      const daysLeft = Math.ceil((deadline - Date.now()) / DAY_MS);
      if (daysLeft <= 3) return OPPORTUNITY_STATUS.CLOSING_SOON;
    }
  }
  return status;
}

export const isClosed = (opportunity) => deriveDisplayStatus(opportunity) === OPPORTUNITY_STATUS.CLOSED;

/** Compact compensation string, e.g. "₹15k/mo" or "₹8 LPA" — null if nothing to show. */
export function formatCompensation({ stipend, salary, currency = "INR", isPaid } = {}) {
  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : `${currency} `;
  if (salary) return `${symbol}${salary}`;
  if (stipend) return `${symbol}${stipend}/mo`;
  return isPaid === false ? "Unpaid" : null;
}
