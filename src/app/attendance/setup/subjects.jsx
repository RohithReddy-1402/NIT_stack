import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useAttendanceSemesters } from "@/hooks/useAttendanceSemesters";
import { useSubjects } from "@/hooks/useSubjects";
import { router } from "expo-router";
import { BookOpen, ChevronLeft, Plus, Trash2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ManageSubjectsScreen() {
  const { addToast } = useToast();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const { activeSemester, loading: semesterLoading } =
    useAttendanceSemesters();
  const { subjects, addSubject, removeSubject, loading } = useSubjects(
    activeSemester?.id,
  );

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setFormOpen(false);
    setName("");
    setCode("");
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await addSubject({ name: name.trim(), code: code.trim() });
      addToast("Subject added", "success");
      resetForm();
    } catch {
      addToast("Failed to add subject.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (subject) => {
    Alert.alert(
      "Delete subject",
      `Delete "${subject.name}"? This removes its timetable slots and attendance history.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removeSubject(subject.id);
              addToast("Subject deleted", "success");
            } catch {
              addToast("Failed to delete subject.", "error");
            }
          },
        },
      ],
    );
  };

  if (!activeSemester) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.brand}>Subjects</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.emptyState}>
          {semesterLoading ? (
            <ActivityIndicator color={colors.chrome} />
          ) : (
            <Text style={styles.emptyTitle}>
              Couldn&apos;t load attendance. Check your connection.
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.brand} numberOfLines={1}>
          Subjects
        </Text>
        <TouchableOpacity onPress={() => setFormOpen(true)} style={styles.backBtn}>
          <Plus size={20} color={colors.chrome} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={subjects}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "attendance/subject/[subjectId]",
                params: {
                  subjectId: item.id,
                  name: item.name,
                  code: item.code ?? "",
                },
              })
            }
          >
            <View style={styles.cardIconBox}>
              <BookOpen size={20} color={colors.chrome} strokeWidth={1.75} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {item.code ? <Text style={styles.cardMeta}>{item.code}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
              <Trash2 size={16} color={colors.danger} strokeWidth={1.75} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <BookOpen size={44} color={colors.steel} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No subjects yet</Text>
            </View>
          )
        }
      />

      <Modal visible={formOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>New subject</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Data Structures"
              placeholderTextColor={colors.steel}
              style={styles.input}
              autoFocus
            />
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="Subject code (optional)"
              placeholderTextColor={colors.steel}
              style={styles.input}
            />
            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (!name.trim() || submitting) && styles.submitBtnDisabled,
                ]}
                disabled={!name.trim() || submitting}
                onPress={handleCreate}
              >
                <Text style={styles.submitText}>
                  {submitting ? "Adding..." : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    brand: { color: colors.chrome, fontSize: 16, fontWeight: "700", flex: 1, textAlign: "center" },

    listContent: { padding: 20 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.onyxRaised,
      padding: 14,
      marginBottom: 12,
    },
    cardIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.onyx,
      borderWidth: 1,
      borderColor: colors.hairline,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitle: { color: colors.chrome, fontSize: 15, fontWeight: "700" },
    cardMeta: { color: colors.steel, fontSize: 12, marginTop: 2 },
    deleteBtn: { marginLeft: 14, padding: 4 },

    emptyState: { alignItems: "center", paddingVertical: 60 },
    emptyTitle: { color: colors.chrome, fontSize: 15, fontWeight: "700", marginTop: 14 },

    modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    sheet: {
      backgroundColor: colors.onyxRaised,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 30,
    },
    sheetTitle: { color: colors.chrome, fontSize: 16, fontWeight: "700", marginBottom: 14 },
    input: {
      backgroundColor: colors.onyx,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: 12,
      paddingHorizontal: 14,
      height: 48,
      color: colors.chrome,
      fontSize: 14,
      marginBottom: 14,
    },
    formActions: { flexDirection: "row", gap: 12, marginTop: 4 },
    cancelBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    cancelText: { color: colors.silver, fontSize: 14, fontWeight: "700" },
    submitBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.chrome,
    },
    submitBtnDisabled: { opacity: 0.4 },
    submitText: { color: colors.void, fontSize: 14, fontWeight: "700" },
  });
