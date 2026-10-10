import { STATUS_LABELS } from "@/constants/opportunities";
import { useTheme } from "@/contexts/ThemeContext";
import { deriveDisplayStatus, relativeDeadlineLabel } from "@/utils/deadline";
import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";

/** "Deadline in 2 days" / "Deadline tomorrow" / "Applications closed", derived client-side from the deadline as a safety net against backend lag. */
export default function DeadlineBadge({ deadline, status }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const displayStatus = deriveDisplayStatus({ applicationDeadline: deadline, status });
  const closed = displayStatus === "closed" || displayStatus === "cancelled";
  const closing = displayStatus === "closing_soon";
  const label = deadline ? relativeDeadlineLabel(deadline) : (STATUS_LABELS[displayStatus] ?? displayStatus);

  if (!label) return null;
  return <Text style={[styles.badge, closing && styles.closing, closed && styles.closed]}>{label}</Text>;
}

const getStyles = (colors) =>
  StyleSheet.create({
    badge: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.silver,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      overflow: "hidden",
    },
    closing: { color: "#1A1400", backgroundColor: "#F5A623", borderColor: "#F5A623" },
    closed: { color: colors.steel },
  });
