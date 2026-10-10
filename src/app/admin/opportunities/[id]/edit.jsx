import ForumTopBar from "@/components/forum/ForumTopBar";
import OpportunityForm from "@/components/opportunities/admin/OpportunityForm";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAdminOpportunities, useAdminOpportunity } from "@/hooks/admin/useAdminOpportunities";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditOpportunityScreen() {
  const { id } = useLocalSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  const { load } = useAdminOpportunity(id);
  const list = useAdminOpportunities({});
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.role !== "admin") router.replace("/");
  }, [authLoading, user]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    load()
      .then(setOpportunity)
      .finally(() => setLoading(false));
  }, [load, user]);

  const submit = async (data) => {
    setSaving(true);
    try {
      await list.update(id, data);
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
      <ForumTopBar title="Edit opportunity" />
      {loading ? <ActivityIndicator color={colors.chrome} style={{ marginTop: 40 }} /> : <OpportunityForm initial={opportunity} saving={saving} onSubmit={submit} />}
    </SafeAreaView>
  );
}
