import { useTheme } from "@/contexts/ThemeContext";
import { FileText, Trash2, Upload } from "lucide-react-native";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

/** Resume upload card — never auto-submitted anywhere, purely for the student's own tracked applications. */
export default function ResumeCard({ resumes, uploading, onUpload, onRemove }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const latest = resumes[0];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Resume</Text>
      {latest ? (
        <View style={styles.row}>
          <FileText size={18} color={colors.chrome} strokeWidth={1.75} />
          <View style={{ flex: 1 }}>
            <Text style={styles.filename} numberOfLines={1}>{latest.filename}</Text>
            <Text style={styles.meta}>Uploaded {new Date(latest.uploadedAt).toLocaleDateString()}</Text>
          </View>
          <TouchableOpacity onPress={() => onRemove(latest.id)} hitSlop={8}>
            <Trash2 size={17} color={colors.danger} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.empty}>No resume uploaded yet.</Text>
      )}
      <TouchableOpacity style={styles.uploadBtn} onPress={onUpload} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color={colors.void} />
        ) : (
          <>
            <Upload size={15} color={colors.void} strokeWidth={2} />
            <Text style={styles.uploadText}>{latest ? "Upload new version" : "Upload resume"}</Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={styles.help}>Stored for your own use when tracking applications — never sent to companies automatically.</Text>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    card: { backgroundColor: colors.onyxRaised, borderRadius: 16, borderWidth: 1, borderColor: colors.hairline, padding: 16 },
    title: { color: colors.chrome, fontSize: 14.5, fontWeight: "700", marginBottom: 10 },
    row: { flexDirection: "row", alignItems: "center", gap: 10 },
    filename: { color: colors.chrome, fontSize: 13.5, fontWeight: "600" },
    meta: { color: colors.steel, fontSize: 11.5, marginTop: 2 },
    empty: { color: colors.steel, fontSize: 13 },
    uploadBtn: {
      marginTop: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.chrome,
    },
    uploadText: { color: colors.void, fontWeight: "700", fontSize: 13.5 },
    help: { color: colors.steel, fontSize: 11.5, marginTop: 10, lineHeight: 16 },
  });
