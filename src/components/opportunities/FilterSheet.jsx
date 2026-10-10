import { OPPORTUNITY_TYPES, WORK_MODES } from "@/constants/opportunities";
import { useTheme } from "@/contexts/ThemeContext";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";

/** Full filter sheet: type, work mode, paid-only, branch, batch, skills, location, stipend range. `value`/`onApply` are plain filter-param objects passed straight through to the feed query. */
export default function FilterSheet({ visible, value, onApply, onClose }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [draft, setDraft] = useState(value ?? {});

  // Re-sync the draft from the current filters whenever the sheet opens —
  // "adjusting state during render" (React's recommended alternative to an
  // effect for this), same pattern useInfiniteList.js uses for its `key` reset.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(value ?? {});
  }

  const set = (patch) => setDraft((prev) => ({ ...prev, ...patch }));
  const apply = () => {
    onApply(draft);
    onClose();
  };
  const clear = () => setDraft({});

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Filters</Text>
          <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 12 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Type</Text>
            <View style={styles.chipRow}>
              {OPPORTUNITY_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.chip, draft.type === t.value && styles.chipActive]}
                  onPress={() => set({ type: draft.type === t.value ? undefined : t.value })}
                >
                  <Text style={[styles.chipText, draft.type === t.value && styles.chipTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Work mode</Text>
            <View style={styles.chipRow}>
              {WORK_MODES.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={[styles.chip, draft.mode === m.value && styles.chipActive]}
                  onPress={() => set({ mode: draft.mode === m.value ? undefined : m.value })}
                >
                  <Text style={[styles.chipText, draft.mode === m.value && styles.chipTextActive]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.label}>Paid only</Text>
              <Switch value={!!draft.paid} onValueChange={(v) => set({ paid: v || undefined })} trackColor={{ true: colors.accent, false: colors.hairline }} />
            </View>

            <Text style={styles.label}>Branch</Text>
            <TextInput style={styles.input} value={draft.branch ?? ""} onChangeText={(v) => set({ branch: v })} placeholder="e.g. CSE" placeholderTextColor={colors.steel} autoCapitalize="characters" />

            <Text style={styles.label}>Batch / graduation year</Text>
            <TextInput style={styles.input} value={draft.batch ?? ""} onChangeText={(v) => set({ batch: v })} placeholder="e.g. 2027" placeholderTextColor={colors.steel} keyboardType="number-pad" />

            <Text style={styles.label}>Skills</Text>
            <TextInput style={styles.input} value={draft.skills ?? ""} onChangeText={(v) => set({ skills: v })} placeholder="comma separated, e.g. Python, React" placeholderTextColor={colors.steel} />

            <Text style={styles.label}>Location</Text>
            <TextInput style={styles.input} value={draft.location ?? ""} onChangeText={(v) => set({ location: v })} placeholder="City or 'remote'" placeholderTextColor={colors.steel} />

            <Text style={styles.label}>Stipend range (₹/mo)</Text>
            <View style={styles.rangeRow}>
              <TextInput style={[styles.input, { flex: 1 }]} value={draft.stipendMin ?? ""} onChangeText={(v) => set({ stipendMin: v })} placeholder="Min" placeholderTextColor={colors.steel} keyboardType="number-pad" />
              <TextInput style={[styles.input, { flex: 1 }]} value={draft.stipendMax ?? ""} onChangeText={(v) => set({ stipendMax: v })} placeholder="Max" placeholderTextColor={colors.steel} keyboardType="number-pad" />
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.clearBtn} onPress={clear}>
              <Text style={styles.clearText}>Clear all</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={apply}>
              <Text style={styles.applyText}>Apply filters</Text>
            </TouchableOpacity>
          </View>
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
      paddingBottom: 24,
      maxHeight: "85%",
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.hairline, alignSelf: "center", marginBottom: 10 },
    title: { color: colors.chrome, fontSize: 17, fontWeight: "700", marginBottom: 6 },
    label: { color: colors.chrome, fontSize: 13.5, fontWeight: "700", marginTop: 14, marginBottom: 8 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.hairline, justifyContent: "center" },
    chipActive: { backgroundColor: colors.chrome, borderColor: colors.chrome },
    chipText: { color: colors.silver, fontWeight: "600", fontSize: 12.5 },
    chipTextActive: { color: colors.void },
    switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
    input: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
      color: colors.chrome,
      padding: 12,
      fontSize: 14.5,
    },
    rangeRow: { flexDirection: "row", gap: 10 },
    actions: { flexDirection: "row", gap: 10, marginTop: 14 },
    clearBtn: { flex: 1, height: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.hairline, alignItems: "center", justifyContent: "center" },
    clearText: { color: colors.silver, fontWeight: "700", fontSize: 14 },
    applyBtn: { flex: 2, height: 46, borderRadius: 14, backgroundColor: colors.chrome, alignItems: "center", justifyContent: "center" },
    applyText: { color: colors.void, fontWeight: "700", fontSize: 14 },
  });
