import { useTheme } from "@/contexts/ThemeContext";
import { Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

/**
 * A password TextInput with a show/hide eye toggle. `inputStyle` should be
 * the screen's own `styles.input` so it matches exactly — its marginBottom
 * moves onto the wrapper here so the toggle can center against just the
 * input's own height instead of the input-plus-margin box.
 */
export default function PasswordInput({ inputStyle, ...textInputProps }) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <TextInput {...textInputProps} secureTextEntry={!visible} style={[inputStyle, styles.input]} />
      <TouchableOpacity
        style={styles.toggle}
        onPress={() => setVisible((v) => !v)}
        hitSlop={10}
        accessibilityLabel={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <EyeOff size={19} color={colors.steel} strokeWidth={1.8} />
        ) : (
          <Eye size={19} color={colors.steel} strokeWidth={1.8} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  input: { marginBottom: 0, paddingRight: 46 },
  toggle: { position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center", alignItems: "center" },
});
