import { useTheme } from "@/contexts/ThemeContext";
import { useMemo } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * Bottom sheet of actions: `[{ key, label, icon: LucideIcon, onPress, destructive, hidden }]`.
 * The sheet closes itself before running the action.
 */
export default function ActionSheet({ visible, title, actions, onClose }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />
          {title ? <Text style={styles.title} numberOfLines={2}>{title}</Text> : null}
          <ScrollView bounces={false}>
            {actions.filter((a) => !a.hidden).map((a) => {
              const Icon = a.icon;
              const color = a.destructive ? colors.danger : colors.chrome;
              return (
                <TouchableOpacity
                  key={a.key}
                  style={styles.row}
                  onPress={() => {
                    onClose();
                    a.onPress();
                  }}
                >
                  {Icon ? <Icon size={19} color={color} strokeWidth={1.8} /> : null}
                  <Text style={[styles.label, { color }]}>{a.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    sheet: {
      backgroundColor: colors.onyxRaised,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 10,
      paddingHorizontal: 20,
      paddingBottom: 34,
      maxHeight: "75%",
    },
    handle: {
      width: 40, height: 4, borderRadius: 2, backgroundColor: colors.hairline, alignSelf: "center", marginBottom: 12,
    },
    title: { color: colors.steel, fontSize: 13, marginBottom: 6 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    label: { fontSize: 15.5, fontWeight: "500" },
  });
