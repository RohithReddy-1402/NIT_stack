import ForumTopBar from "@/components/forum/ForumTopBar";
import CareerProfileForm from "@/components/opportunities/CareerProfileForm";
import ResumeCard from "@/components/opportunities/ResumeCard";
import { useTheme } from "@/contexts/ThemeContext";
import { useCareerProfile } from "@/hooks/opportunities/useCareerProfile";
import { useResume } from "@/hooks/opportunities/useResume";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Optional career profile + resume — feeds the "Recommended for you" opportunities feed. */
export default function CareerProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { profile, loading, saving, save, completeness } = useCareerProfile();
  const resume = useResume();

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ForumTopBar title="Career profile" />
        <ActivityIndicator color={colors.chrome} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ForumTopBar title="Career profile" subtitle={`${completeness}% complete`} />
      <View style={styles.resumeWrap}>
        <ResumeCard resumes={resume.resumes} uploading={resume.uploading} onUpload={resume.upload} onRemove={resume.remove} />
      </View>
      <CareerProfileForm profile={profile} saving={saving} onSave={save} />
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    resumeWrap: { paddingHorizontal: 20, paddingTop: 16 },
  });
