import ForumTopBar from "@/components/forum/ForumTopBar";
import OpportunityForm from "@/components/opportunities/admin/OpportunityForm";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAdminOpportunities } from "@/hooks/admin/useAdminOpportunities";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewOpportunityScreen() {
  const { user, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  const list = useAdminOpportunities({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace("/");
  }, [authLoading, user]);

  const submit = async (data) => {
    setSaving(true);
    try {
      await list.create(data);
      router.back();
    } catch {
      // useAdminOpportunities already toasted the error.
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || user?.role !== "admin") return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.void }} edges={["top"]}>
      <ForumTopBar title="New opportunity" subtitle="Saved as a draft — publish when ready" />
      <OpportunityForm saving={saving} onSubmit={submit} />
    </SafeAreaView>
  );
}
