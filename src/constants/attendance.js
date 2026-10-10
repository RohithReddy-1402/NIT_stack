export const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

export const STATUS = {
  PRESENT: "present",
  ABSENT: "absent",
  CANCELLED: "cancelled",
};

export const STATUS_LABELS = {
  [STATUS.PRESENT]: "Present",
  [STATUS.ABSENT]: "Absent",
  [STATUS.CANCELLED]: "Cancelled",
};

export function statusColor(status, colors) {
  switch (status) {
    case STATUS.PRESENT:
      return colors.success;
    case STATUS.ABSENT:
      return colors.danger;
    case STATUS.CANCELLED:
      return colors.steel;
    default:
      return colors.hairline;
  }
}
