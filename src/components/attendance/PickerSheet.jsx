import { useTheme } from "@/contexts/ThemeContext";
import { useMemo } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Generic bottom-sheet picker, extracted from the inline modal pattern in
// contribute/index.jsx. `options` is an array of either primitive values or
// {label, value} objects; `getLabel`/`getValue` let callers use plain objects.
export default function PickerSheet({
  visible,
  title,
  options,
  onSelect,
  onClose,
  getLabel = (o) => o?.label ?? String(o),
  getValue = (o) => o?.value ?? o,
  keyExtractor = (o) => String(getValue(o)),
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <FlatList
            data={options}
            keyExtractor={keyExtractor}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.option}
                onPress={() => onSelect(getValue(item))}
              >
                <Text style={styles.optionText}>{getLabel(item)}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.onyxRaised,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 10,
      paddingHorizontal: 20,
      paddingBottom: 30,
      maxHeight: "60%",
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.hairline,
      alignSelf: "center",
      marginBottom: 14,
    },
    title: {
      color: colors.chrome,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 8,
    },
    option: {
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    optionText: { color: colors.silver, fontSize: 15 },
  });
