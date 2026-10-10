import ForumTopBar from "@/components/forum/ForumTopBar";
import OpportunityForm from "@/components/opportunities/admin/OpportunityForm";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useOpportunityGate } from "@/hooks/opportunities/useOpportunityGate";
import { submitOpportunity } from "@/services/opportunities";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Anyone signed in can submit an opportunity for review — same form as the admin's, minus the publish controls. It lands as a pending draft until an admin reviews and publishes (or rejects) it. */
export default function SubmitOpportunityScreen() {
  const { token, isLoggedIn, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  const { addToast } = useToast();
  const { handleError } = useOpportunityGate();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.replace("/login");
  }, [authLoading, isLoggedIn]);

  if (authLoading || !isLoggedIn) return null;

  const submit = async (data) => {
    setSaving(true);
    try {
      await submitOpportunity(token, data);
      addToast("Submitted — an admin will review it shortly", "success");
      router.back();
    } catch (error) {
      handleError(error, "Couldn't submit that opportunity");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.void }} edges={["top"]}>
      <ForumTopBar title="Submit an opportunity" subtitle="Reviewed by an admin before it goes live" />
      <View style={styles.notice}>
        <Text style={[styles.noticeText, { color: colors.steel }]}>
          Know of an internship, hackathon, or scholarship that should be here? Fill this in and an admin will review it.
        </Text>
      </View>
      <OpportunityForm saving={saving} onSubmit={submit} submitLabel="Submit for review" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  notice: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 4 },
  noticeText: { fontSize: 12.5, lineHeight: 18 },
});
