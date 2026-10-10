import PickerSheet from "@/components/attendance/PickerSheet";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS } from "@/constants/opportunities";

/** Self-reported application status picker for the "My Applications" tracker. */
export default function ApplicationStatusSheet({ visible, onSelect, onClose }) {
  return (
    <PickerSheet
      visible={visible}
      title="Update application status"
      options={APPLICATION_STATUSES.map((s) => ({ label: APPLICATION_STATUS_LABELS[s], value: s }))}
      onSelect={onSelect}
      onClose={onClose}
    />
  );
}
