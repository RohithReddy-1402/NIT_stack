import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { ChevronDown, ChevronLeft, FileUp, UploadCloud } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const colors = {
  void: "#0A0A0B",
  onyx: "#141416",
  onyxRaised: "#1C1C1F",
  chrome: "#F5F5F7",
  silver: "#C9C9CE",
  steel: "#8E8E93",
  hairline: "#2C2C30",
  accent: "#8E8EFF",
};

const SEMESTERS = Array.from({ length: 8 }, (_, i) => String(i + 1));
const EXAM_TYPES = ["Mid-1", "Mid-2", "Sem"];

async function uploadToR2(file, metadata) {
  const urlResponse = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/r2/upload-url`,
    { method: "GET", headers: { "Content-Type": "application/json" } },
  );
  const { key, uploadUrl, r2Id } = await urlResponse.json();

  const fileResponse = await fetch(file.uri);
  const blob = await fileResponse.blob();

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.mimeType || "application/pdf" },
    body: blob,
  });

  if (!uploadResponse.ok) throw new Error("R2 upload failed");

  const dbResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...metadata,
      paper_id: r2Id,
      r2Key: key,
      fileId: r2Id,
    }),
  });

  return dbResponse;
}

export default function ContributeScreen() {
  const { isLoggedIn, user, loading: authLoading } = useAuth();
  const { addToast } = useToast();

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [subCode, setSubCode] = useState("");
  const [semester, setSemester] = useState("");
  const [year, setYear] = useState("");
  const [examType, setExamType] = useState("");
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pickerModal, setPickerModal] = useState(null); // "semester" | "type" | null

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [authLoading, isLoggedIn]);

  if (!isLoggedIn) return null;

  const fields = [title, subject, semester, subCode, year, examType, file];
  const filledCount = fields.filter(Boolean).length;
  const allFilled = filledCount === fields.length;

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
    });
    if (!result.canceled && result.assets?.[0]) {
      setFile(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!allFilled) return;
    setSubmitting(true);
    try {
      const response = await uploadToR2(file, {
        title,
        subject,
        semester,
        subCode,
        year,
        institution: examType,
        name: user?.name,
        mail: user?.email,
      });

      if (response.status === 201) {
        addToast("Details sent for verification", "success");
        router.back();
      } else {
        addToast("Please upload again, an error occurred.", "error");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      addToast("Upload failed. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={colors.chrome} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.brand}>Contribute a Paper</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Paper Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="E.g., Data Structures, DSD"
          placeholderTextColor={colors.steel}
          style={styles.input}
        />

        <Text style={styles.label}>Subject</Text>
        <TextInput
          value={subject}
          onChangeText={setSubject}
          placeholder="E.g., C, Python, AC Machines"
          placeholderTextColor={colors.steel}
          style={styles.input}
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Semester</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setPickerModal("semester")}
              activeOpacity={0.8}
            >
              <Text style={styles.selectText}>{semester || "Select"}</Text>
              <ChevronDown size={16} color={colors.steel} />
            </TouchableOpacity>
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Subject Code</Text>
            <TextInput
              value={subCode}
              onChangeText={setSubCode}
              placeholder="CSIC-101"
              placeholderTextColor={colors.steel}
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Year</Text>
            <TextInput
              value={year}
              onChangeText={setYear}
              placeholder="2024"
              placeholderTextColor={colors.steel}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Exam Type</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setPickerModal("type")}
              activeOpacity={0.8}
            >
              <Text style={styles.selectText}>{examType || "Select"}</Text>
              <ChevronDown size={16} color={colors.steel} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.label}>Upload File (PDF only)</Text>
        <TouchableOpacity
          style={styles.fileBtn}
          activeOpacity={0.8}
          onPress={handlePickFile}
        >
          <FileUp size={18} color={colors.chrome} strokeWidth={1.75} />
          <Text style={styles.fileBtnText} numberOfLines={1}>
            {file ? file.name : "Choose a file"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!allFilled || submitting) && styles.submitBtnDisabled,
          ]}
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={!allFilled || submitting}
        >
          <UploadCloud size={16} color={colors.void} strokeWidth={2} />
          <Text style={styles.submitText}>
            {submitting ? "Uploading..." : "Contribute Paper"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={!!pickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerModal(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPickerModal(null)}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {pickerModal === "semester" ? "Select semester" : "Select exam type"}
            </Text>
            <FlatList
              data={pickerModal === "semester" ? SEMESTERS : EXAM_TYPES}
              keyExtractor={(o) => o}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.sheetOption}
                  onPress={() => {
                    if (pickerModal === "semester") setSemester(item);
                    else setExamType(item);
                    setPickerModal(null);
                  }}
                >
                  <Text style={styles.sheetOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.void },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  brand: { color: colors.chrome, fontSize: 16, fontWeight: "700", flex: 1, textAlign: "center" },

  content: { padding: 20 },
  label: { color: colors.silver, fontSize: 12.5, fontWeight: "600", marginBottom: 8 },
  input: {
    backgroundColor: colors.onyxRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    color: colors.chrome,
    fontSize: 14,
    marginBottom: 16,
  },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.onyxRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
  },
  selectText: { color: colors.chrome, fontSize: 14 },

  fileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.onyxRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 24,
  },
  fileBtnText: { color: colors.silver, fontSize: 13.5, flexShrink: 1 },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.chrome,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 30,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { color: colors.void, fontSize: 14.5, fontWeight: "700" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.onyxRaised,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: "60%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.hairline,
    alignSelf: "center",
    marginBottom: 14,
  },
  sheetTitle: { color: colors.chrome, fontSize: 16, fontWeight: "700", marginBottom: 8 },
  sheetOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.hairline },
  sheetOptionText: { color: colors.silver, fontSize: 15 },
});
