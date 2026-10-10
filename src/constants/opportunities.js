export const OPPORTUNITY_TYPES = [
  { value: "internship", label: "Internship" },
  { value: "full_time", label: "Full-time placement" },
  { value: "part_time", label: "Part-time" },
  { value: "research_internship", label: "Research internship" },
  { value: "research_opportunity", label: "Research opportunity" },
  { value: "fellowship", label: "Fellowship" },
  { value: "scholarship", label: "Scholarship" },
  { value: "hackathon", label: "Hackathon" },
  { value: "competition", label: "Competition" },
  { value: "workshop", label: "Workshop" },
  { value: "certification", label: "Certification" },
  { value: "government", label: "Government opportunity" },
  { value: "other", label: "Other" },
];
export const opportunityTypeLabel = (value) => OPPORTUNITY_TYPES.find((t) => t.value === value)?.label ?? value;

export const WORK_MODES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

// "draft"/"scheduled" are admin-only pre-publish states; everything else is
// what students see. Deadline-based transitions (open → closing_soon →
// closed) are owned by the backend but re-derived defensively on the client
// too — see src/utils/deadline.js.
export const OPPORTUNITY_STATUS = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  OPEN: "open",
  CLOSING_SOON: "closing_soon",
  CLOSED: "closed",
  UPCOMING: "upcoming",
  CANCELLED: "cancelled",
};

export const STATUS_LABELS = {
  draft: "Draft",
  scheduled: "Scheduled",
  open: "Open",
  closing_soon: "Closing soon",
  closed: "Closed",
  upcoming: "Upcoming",
  cancelled: "Cancelled",
};

export const VERIFICATION_STATUS = {
  VERIFIED: "verified",
  PENDING: "pending",
  EXPIRED: "expired",
  REPORTED: "reported",
  UNDER_REVIEW: "under_review",
};

export const VERIFICATION_LABELS = {
  verified: "Verified",
  pending: "Pending verification",
  expired: "Expired",
  reported: "Reported",
  under_review: "Under review",
};

export const APPLICATION_STATUSES = [
  "interested",
  "applied",
  "assessment",
  "interview",
  "selected",
  "rejected",
  "withdrawn",
];

export const APPLICATION_STATUS_LABELS = {
  interested: "Interested",
  applied: "Applied",
  assessment: "Assessment",
  interview: "Interview",
  selected: "Selected",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

// Opportunity-specific report reasons — distinct from forum's ReportSheet
// reasons (harassment/hate/etc.), which don't apply here.
export const OPPORTUNITY_REPORT_REASONS = [
  { value: "incorrect_info", label: "Incorrect information" },
  { value: "expired", label: "Already expired or closed" },
  { value: "spam", label: "Spam" },
  { value: "scam", label: "Looks like a scam" },
  { value: "duplicate", label: "Duplicate posting" },
  { value: "other", label: "Something else" },
];

export const REMINDER_LEAD_OPTIONS = [
  { value: 24, label: "24 hours before" },
  { value: 72, label: "3 days before" },
  { value: 168, label: "7 days before" },
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "deadline", label: "Deadline" },
  { value: "relevance", label: "Most relevant" },
  { value: "updated", label: "Recently updated" },
];

// Keys match the API contract's `categories` object on NotificationPreference.
export const NOTIFICATION_CATEGORIES = [
  { key: "newInternships", label: "New internships" },
  { key: "newPlacements", label: "New placement opportunities" },
  { key: "newResearch", label: "New research opportunities" },
  { key: "newHackathons", label: "New hackathons" },
  { key: "newScholarships", label: "New scholarships" },
  { key: "deadlineReminders", label: "Deadline reminders" },
  { key: "branchMatch", label: "Opportunities matching my branch" },
  { key: "batchMatch", label: "Opportunities matching my batch" },
  { key: "skillsMatch", label: "Opportunities matching my skills" },
];
