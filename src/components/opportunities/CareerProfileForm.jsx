import { OPPORTUNITY_TYPES } from "@/constants/opportunities";
import { useTheme } from "@/contexts/ThemeContext";
import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

/** Optional career-profile fields used for personalized recommendations — nothing here is required. */
export default function CareerProfileForm({ profile, saving, onSave }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [form, setForm] = useState(profile);
  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const setList = (key, text) => set({ [key]: text.split(",").map((s) => s.trim()).filter(Boolean) });

  const toggleType = (value) => {
    const current = form.preferredTypes ?? [];
    set({ preferredTypes: current.includes(value) ? current.filter((v) => v !== value) : [...current, value] });
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Branch / department</Text>
      <TextInput style={styles.input} value={form.branch ?? ""} onChangeText={(v) => set({ branch: v })} placeholder="e.g. CSE" placeholderTextColor={colors.steel} />

      <Text style={styles.label}>Batch</Text>
      <TextInput style={styles.input} value={form.batch ?? ""} onChangeText={(v) => set({ batch: v })} placeholder="e.g. 2023-2027" placeholderTextColor={colors.steel} />

      <Text style={styles.label}>Graduation year</Text>
      <TextInput style={styles.input} value={String(form.graduationYear ?? "")} onChangeText={(v) => set({ graduationYear: v })} placeholder="e.g. 2027" placeholderTextColor={colors.steel} keyboardType="number-pad" />

      <Text style={styles.label}>Current semester</Text>
      <TextInput style={styles.input} value={String(form.semester ?? "")} onChangeText={(v) => set({ semester: v })} placeholder="e.g. 5" placeholderTextColor={colors.steel} keyboardType="number-pad" />

      <Text style={styles.label}>CGPA</Text>
      <TextInput style={styles.input} value={String(form.cgpa ?? "")} onChangeText={(v) => set({ cgpa: v })} placeholder="e.g. 8.4" placeholderTextColor={colors.steel} keyboardType="decimal-pad" />

      <Text style={styles.label}>Skills</Text>
      <TextInput style={styles.input} value={(form.skills ?? []).join(", ")} onChangeText={(v) => setList("skills", v)} placeholder="comma separated, e.g. Python, React" placeholderTextColor={colors.steel} />

      <Text style={styles.label}>Preferred locations</Text>
      <TextInput style={styles.input} value={(form.preferredLocations ?? []).join(", ")} onChangeText={(v) => setList("preferredLocations", v)} placeholder="e.g. Bengaluru, Remote" placeholderTextColor={colors.steel} />

      <Text style={styles.label}>Preferred companies</Text>
      <TextInput style={styles.input} value={(form.preferredCompanies ?? []).join(", ")} onChangeText={(v) => setList("preferredCompanies", v)} placeholder="optional" placeholderTextColor={colors.steel} />

      <Text style={styles.label}>Preferred opportunity types</Text>
      <View style={styles.chipRow}>
        {OPPORTUNITY_TYPES.map((t) => {
          const active = (form.preferredTypes ?? []).includes(t.value);
          return (
            <TouchableOpacity key={t.value} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleType(t.value)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.saveBtn} disabled={saving} onPress={() => onSave(form)}>
        {saving ? <ActivityIndicator color={colors.void} /> : <Text style={styles.saveText}>Save career profile</Text>}
      </TouchableOpacity>
      <Text style={styles.help}>Used only to personalize recommendations — never shared with companies, and everything here is optional.</Text>
    </ScrollView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    content: { padding: 20, paddingBottom: 110 }, // clears the floating bottom tab bar
    label: { color: colors.chrome, fontSize: 13.5, fontWeight: "700", marginTop: 14, marginBottom: 8 },
    input: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
      color: colors.chrome,
      padding: 12,
      fontSize: 14.5,
    },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.hairline, justifyContent: "center" },
    chipActive: { backgroundColor: colors.chrome, borderColor: colors.chrome },
    chipText: { color: colors.silver, fontWeight: "600", fontSize: 12.5 },
    chipTextActive: { color: colors.void },
    saveBtn: { marginTop: 22, height: 48, borderRadius: 14, backgroundColor: colors.chrome, alignItems: "center", justifyContent: "center" },
    saveText: { color: colors.void, fontWeight: "700", fontSize: 15 },
    help: { color: colors.steel, fontSize: 12, marginTop: 10, lineHeight: 17 },
  });
