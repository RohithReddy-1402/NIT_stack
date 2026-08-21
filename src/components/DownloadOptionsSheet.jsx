import { Eye, FolderDown, Save } from "lucide-react-native";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const colors = {
  onyxRaised: "#1C1C1F",
  onyx: "#141416",
  chrome: "#F5F5F7",
  silver: "#C9C9CE",
  steel: "#8E8E93",
  hairline: "#2C2C30",
};

export default function DownloadOptionsSheet({
  visible,
  title,
  subtitle,
  onClose,
  onView,
  onSaveInApp,
  onSaveToDevice,
}) {
  const pick = (action) => {
    onClose?.();
    action?.();
  };

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
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <TouchableOpacity
            style={styles.option}
            activeOpacity={0.8}
            onPress={() => pick(onView)}
          >
            <View style={styles.optionIcon}>
              <Eye size={18} color={colors.chrome} strokeWidth={1.75} />
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>View</Text>
              <Text style={styles.optionDesc}>Open the paper right now</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            activeOpacity={0.8}
            onPress={() => pick(onSaveInApp)}
          >
            <View style={styles.optionIcon}>
              <Save size={18} color={colors.chrome} strokeWidth={1.75} />
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>Save in App</Text>
              <Text style={styles.optionDesc}>
                Keeps it in your Library, hidden from the phone&apos;s files
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            activeOpacity={0.8}
            onPress={() => pick(onSaveToDevice)}
          >
            <View style={styles.optionIcon}>
              <FolderDown size={18} color={colors.chrome} strokeWidth={1.75} />
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionTitle}>Save to Device</Text>
              <Text style={styles.optionDesc}>
                Choose where it lands — Files, Downloads, Drive
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancel}
            activeOpacity={0.8}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    paddingBottom: 34,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.hairline,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    color: colors.chrome,
    fontSize: 16,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.steel,
    fontSize: 12.5,
    marginTop: 4,
    marginBottom: 6,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    marginTop: 8,
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.onyx,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  optionTextWrap: { flex: 1 },
  optionTitle: { color: colors.chrome, fontSize: 14.5, fontWeight: "700" },
  optionDesc: { color: colors.steel, fontSize: 12, marginTop: 2 },
  cancel: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.onyx,
    alignItems: "center",
  },
  cancelText: { color: colors.silver, fontSize: 14, fontWeight: "700" },
});
