import PickerSheet from "@/components/attendance/PickerSheet";
import { REMINDER_LEAD_OPTIONS } from "@/constants/opportunities";

/** "Remind me" lead-time picker — 24h / 3 days / 7 days before the deadline. */
export default function ReminderSheet({ visible, onSelect, onClose }) {
  return (
    <PickerSheet
      visible={visible}
      title="Remind me before the deadline"
      options={REMINDER_LEAD_OPTIONS}
      onSelect={onSelect}
      onClose={onClose}
    />
  );
}
