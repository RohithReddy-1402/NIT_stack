import PostEditor, { TenTapStartKit, darkEditorTheme, defaultEditorTheme, useEditorBridge } from "@/components/forum/PostEditor";
import { OPPORTUNITY_TYPES, WORK_MODES } from "@/constants/opportunities";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { compressLogo, pickDocument, pickLogo, uploadFile } from "@/services/opportunityUploads";
import { FileText, Image as ImageIcon, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";

const emptyForm = (initial) => ({
  title: initial?.title ?? "",
  companyName: initial?.company?.name ?? "",
  companyLogoKey: initial?.company?.logoKey ?? null,
  companyLogoUrl: initial?.company?.logoUrl ?? null,
  type: initial?.type ?? "internship",
  shortDescription: initial?.shortDescription ?? "",
  eligibilityCriteria: initial?.eligibility?.criteria ?? "",
  branches: (initial?.eligibility?.branches ?? []).join(", "),
  batches: (initial?.eligibility?.batches ?? []).join(", "),
  semesters: (initial?.eligibility?.semesters ?? []).join(", "),
  minCgpa: initial?.eligibility?.minCgpa != null ? String(initial.eligibility.minCgpa) : "",
  backlogsAllowed: initial?.eligibility?.backlogsAllowed ?? true,
  skillsRequired: (initial?.skills?.required ?? []).join(", "),
  skillsPreferred: (initial?.skills?.preferred ?? []).join(", "),
  locationText: initial?.location?.text ?? "",
  mode: initial?.location?.mode ?? "onsite",
  stipend: initial?.compensation?.stipend != null ? String(initial.compensation.stipend) : "",
  salary: initial?.compensation?.salary ?? "",
  isPaid: initial?.compensation?.isPaid ?? true,
  duration: initial?.duration ?? "",
  applicationStartDate: initial?.applicationStartDate ?? "",
  applicationDeadline: initial?.applicationDeadline ?? "",
  selectionProcess: initial?.selectionProcess ?? "",
  openings: initial?.openings != null ? String(initial.openings) : "",
  applicationUrl: initial?.links?.applicationUrl ?? "",
  companyUrl: initial?.links?.companyUrl ?? "",
  sourceUrl: initial?.links?.sourceUrl ?? "",
  contact: initial?.contact ?? "",
  instructions: initial?.instructions ?? "",
  attachments: initial?.attachments ?? [],
});

const splitList = (text) => text.split(",").map((s) => s.trim()).filter(Boolean);

/** Shared create/edit/submit form — assembles the full opportunity payload matching the API contract. Used by admin's new.jsx/[id]/edit.jsx and the student submit.jsx. */
export default function OpportunityForm({ initial, saving, onSubmit, submitLabel }) {
  const { colors, isDark } = useTheme();
  const { token } = useAuth();
  const { addToast } = useToast();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [form, setForm] = useState(() => emptyForm(initial));
  const [logoUploading, setLogoUploading] = useState(false);
  const [attachmentUploading, setAttachmentUploading] = useState(false);

  const editor = useEditorBridge({
    bridgeExtensions: TenTapStartKit,
    dynamicHeight: true,
    theme: isDark ? darkEditorTheme : defaultEditorTheme,
    initialContent: initial?.description ?? "",
  });

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const uploadLogo = async () => {
    const asset = await pickLogo().catch(() => null);
    if (!asset) return;
    setLogoUploading(true);
    try {
      const compressed = await compressLogo(asset);
      const uploaded = await uploadFile(token, "opportunity-logo", compressed);
      set({ companyLogoKey: uploaded.key, companyLogoUrl: uploaded.url });
    } catch (error) {
      addToast(error?.message || "Couldn't upload the logo", "error");
    } finally {
      setLogoUploading(false);
    }
  };

  const addAttachment = async () => {
    let file;
    try {
      file = await pickDocument();
    } catch (error) {
      addToast(error?.message || "Couldn't open that file", "error");
      return;
    }
    if (!file) return;
    setAttachmentUploading(true);
    try {
      const uploaded = await uploadFile(token, "opportunity-attachment", file);
      set({ attachments: [...form.attachments, { name: file.name, url: uploaded.url, size: uploaded.bytes }] });
    } catch (error) {
      addToast(error?.message || "Couldn't upload the attachment", "error");
    } finally {
      setAttachmentUploading(false);
    }
  };

  const removeAttachment = (index) => set({ attachments: form.attachments.filter((_, i) => i !== index) });

  const submit = async () => {
    const description = await editor.getHTML();
    onSubmit({
      title: form.title.trim(),
      company: { name: form.companyName.trim(), logoKey: form.companyLogoKey, logoUrl: form.companyLogoUrl },
      type: form.type,
      shortDescription: form.shortDescription.trim(),
      description,
      eligibility: {
        criteria: form.eligibilityCriteria.trim(),
        branches: splitList(form.branches),
        batches: splitList(form.batches),
        semesters: splitList(form.semesters),
        minCgpa: form.minCgpa ? Number(form.minCgpa) : undefined,
        backlogsAllowed: form.backlogsAllowed,
      },
      skills: { required: splitList(form.skillsRequired), preferred: splitList(form.skillsPreferred) },
      location: { text: form.locationText.trim(), mode: form.mode },
      compensation: {
        stipend: form.stipend ? Number(form.stipend) : undefined,
        salary: form.salary.trim() || undefined,
        isPaid: form.isPaid,
      },
      duration: form.duration.trim(),
      applicationStartDate: form.applicationStartDate.trim() || undefined,
      applicationDeadline: form.applicationDeadline.trim() || undefined,
      selectionProcess: form.selectionProcess.trim(),
      openings: form.openings ? Number(form.openings) : undefined,
      links: {
        applicationUrl: form.applicationUrl.trim(),
        companyUrl: form.companyUrl.trim() || undefined,
        sourceUrl: form.sourceUrl.trim() || undefined,
      },
      contact: form.contact.trim() || undefined,
      instructions: form.instructions.trim() || undefined,
      attachments: form.attachments,
    });
  };

  const ready = form.title.trim() && form.companyName.trim() && form.applicationUrl.trim();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Field label="Title" value={form.title} onChangeText={(v) => set({ title: v })} styles={styles} colors={colors} />
        <Field label="Company / organization" value={form.companyName} onChangeText={(v) => set({ companyName: v })} styles={styles} colors={colors} />

        <TouchableOpacity style={styles.logoBtn} onPress={uploadLogo} disabled={logoUploading}>
          {logoUploading ? <ActivityIndicator color={colors.chrome} /> : <ImageIcon size={16} color={colors.chrome} strokeWidth={1.8} />}
          <Text style={styles.logoBtnText}>{form.companyLogoUrl ? "Change company logo" : "Upload company logo"}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Opportunity type</Text>
        <View style={styles.chipRow}>
          {OPPORTUNITY_TYPES.map((t) => (
            <TouchableOpacity key={t.value} style={[styles.chip, form.type === t.value && styles.chipActive]} onPress={() => set({ type: t.value })}>
              <Text style={[styles.chipText, form.type === t.value && styles.chipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Field label="Short description" value={form.shortDescription} onChangeText={(v) => set({ shortDescription: v })} multiline styles={styles} colors={colors} />

        <Text style={styles.label}>Complete description</Text>
        <PostEditor editor={editor} allowImages={false} minHeight={200} />

        <Text style={styles.sectionTitle}>Eligibility</Text>
        <Field label="Eligible branches (comma separated)" value={form.branches} onChangeText={(v) => set({ branches: v })} placeholder="CSE, ECE, IT" styles={styles} colors={colors} />
        <Field label="Eligible batches / graduation years" value={form.batches} onChangeText={(v) => set({ batches: v })} placeholder="2026, 2027" styles={styles} colors={colors} />
        <Field label="Eligible semesters" value={form.semesters} onChangeText={(v) => set({ semesters: v })} placeholder="5, 6, 7" styles={styles} colors={colors} />
        <Field label="Minimum CGPA" value={form.minCgpa} onChangeText={(v) => set({ minCgpa: v })} keyboardType="decimal-pad" styles={styles} colors={colors} />
        <View style={styles.switchRow}>
          <Text style={styles.label}>Backlogs allowed</Text>
          <Switch value={form.backlogsAllowed} onValueChange={(v) => set({ backlogsAllowed: v })} trackColor={{ true: colors.accent, false: colors.hairline }} />
        </View>
        <Field label="Eligibility criteria (free text)" value={form.eligibilityCriteria} onChangeText={(v) => set({ eligibilityCriteria: v })} multiline styles={styles} colors={colors} />

        <Text style={styles.sectionTitle}>Skills</Text>
        <Field label="Required skills (comma separated)" value={form.skillsRequired} onChangeText={(v) => set({ skillsRequired: v })} styles={styles} colors={colors} />
        <Field label="Preferred skills (comma separated)" value={form.skillsPreferred} onChangeText={(v) => set({ skillsPreferred: v })} styles={styles} colors={colors} />

        <Text style={styles.sectionTitle}>Location & compensation</Text>
        <Field label="Work location" value={form.locationText} onChangeText={(v) => set({ locationText: v })} placeholder="City, or 'Remote'" styles={styles} colors={colors} />
        <View style={styles.chipRow}>
          {WORK_MODES.map((m) => (
            <TouchableOpacity key={m.value} style={[styles.chip, form.mode === m.value && styles.chipActive]} onPress={() => set({ mode: m.value })}>
              <Text style={[styles.chipText, form.mode === m.value && styles.chipTextActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Paid</Text>
          <Switch value={form.isPaid} onValueChange={(v) => set({ isPaid: v })} trackColor={{ true: colors.accent, false: colors.hairline }} />
        </View>
        <Field label="Stipend (₹/month)" value={form.stipend} onChangeText={(v) => set({ stipend: v })} keyboardType="number-pad" styles={styles} colors={colors} />
        <Field label="Salary / package (if applicable)" value={form.salary} onChangeText={(v) => set({ salary: v })} placeholder="e.g. ₹8 LPA" styles={styles} colors={colors} />
        <Field label="Duration" value={form.duration} onChangeText={(v) => set({ duration: v })} placeholder="e.g. 6 months" styles={styles} colors={colors} />
        <Field label="Number of openings" value={form.openings} onChangeText={(v) => set({ openings: v })} keyboardType="number-pad" styles={styles} colors={colors} />

        <Text style={styles.sectionTitle}>Dates</Text>
        <Field label="Application opens (YYYY-MM-DD)" value={form.applicationStartDate} onChangeText={(v) => set({ applicationStartDate: v })} placeholder="2026-09-01" styles={styles} colors={colors} />
        <Field label="Application deadline (YYYY-MM-DD)" value={form.applicationDeadline} onChangeText={(v) => set({ applicationDeadline: v })} placeholder="2026-09-30" styles={styles} colors={colors} />

        <Text style={styles.sectionTitle}>Process & links</Text>
        <Field label="Selection process" value={form.selectionProcess} onChangeText={(v) => set({ selectionProcess: v })} multiline styles={styles} colors={colors} />
        <Field label="Official application URL" value={form.applicationUrl} onChangeText={(v) => set({ applicationUrl: v })} keyboardType="url" autoCapitalize="none" styles={styles} colors={colors} />
        <Field label="Official company URL" value={form.companyUrl} onChangeText={(v) => set({ companyUrl: v })} keyboardType="url" autoCapitalize="none" styles={styles} colors={colors} />
        <Field label="Source / reference URL" value={form.sourceUrl} onChangeText={(v) => set({ sourceUrl: v })} keyboardType="url" autoCapitalize="none" styles={styles} colors={colors} />
        <Field label="Contact information" value={form.contact} onChangeText={(v) => set({ contact: v })} styles={styles} colors={colors} />
        <Field label="Important instructions" value={form.instructions} onChangeText={(v) => set({ instructions: v })} multiline styles={styles} colors={colors} />

        <Text style={styles.sectionTitle}>Attachments</Text>
        {form.attachments.map((a, i) => (
          <View key={`${a.url}-${i}`} style={styles.attachmentRow}>
            <FileText size={15} color={colors.chrome} strokeWidth={1.8} />
            <Text style={styles.attachmentName} numberOfLines={1}>{a.name}</Text>
            <TouchableOpacity onPress={() => removeAttachment(i)} hitSlop={8}>
              <X size={15} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.logoBtn} onPress={addAttachment} disabled={attachmentUploading}>
          {attachmentUploading ? <ActivityIndicator color={colors.chrome} /> : <FileText size={16} color={colors.chrome} strokeWidth={1.8} />}
          <Text style={styles.logoBtnText}>Add attachment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.submitBtn, !ready && styles.submitDisabled]} disabled={!ready || saving} onPress={submit}>
          {saving ? <ActivityIndicator color={colors.void} /> : <Text style={styles.submitText}>{submitLabel ?? (initial ? "Save changes" : "Create opportunity (draft)")}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, styles, colors, multiline, ...inputProps }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        placeholderTextColor={colors.steel}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        {...inputProps}
      />
    </>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    // Extra bottom clearance so the submit button doesn't rest right behind
    // the floating bottom tab bar (see the [slug].jsx footer comment for why).
    content: { padding: 20, paddingBottom: 150, gap: 4 },
    sectionTitle: { color: colors.chrome, fontSize: 15, fontWeight: "800", marginTop: 22, marginBottom: 4 },
    label: { color: colors.chrome, fontSize: 13, fontWeight: "700", marginTop: 12, marginBottom: 7 },
    input: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
      color: colors.chrome,
      padding: 12,
      fontSize: 14,
    },
    inputMultiline: { minHeight: 70 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
    chip: { height: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.hairline, justifyContent: "center" },
    chipActive: { backgroundColor: colors.chrome, borderColor: colors.chrome },
    chipText: { color: colors.silver, fontWeight: "600", fontSize: 12.5 },
    chipTextActive: { color: colors.void },
    switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
    logoBtn: {
      marginTop: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 42,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
    },
    logoBtnText: { color: colors.chrome, fontWeight: "600", fontSize: 13 },
    attachmentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    attachmentName: { flex: 1, color: colors.silver, fontSize: 13 },
    submitBtn: { marginTop: 26, height: 50, borderRadius: 14, backgroundColor: colors.chrome, alignItems: "center", justifyContent: "center" },
    submitDisabled: { opacity: 0.4 },
    submitText: { color: colors.void, fontWeight: "700", fontSize: 15 },
  });
