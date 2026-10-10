import ForumTopBar from "@/components/forum/ForumTopBar";
import { NOTIFICATION_CATEGORIES } from "@/constants/opportunities";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotificationPreferences } from "@/hooks/opportunities/useNotificationPreferences";
import { useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Notification preferences — categories, channels, and push opt-in. Mirrors attendance/setup/notifications.jsx's toggle pattern. */
export default function OpportunityNotificationSettingsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { prefs, loading, busy, save, setPushEnabled } = useNotificationPreferences();

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ForumTopBar title="Notifications" />
        <ActivityIndicator color={colors.chrome} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const toggleCategory = (key, value) => save({ categories: { ...prefs.categories, [key]: value } });

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ForumTopBar title="Notifications" subtitle="Opportunities" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Channels</Text>
        <View style={styles.card}>
          <Row label="In-app" subtitle="Always on — shown in your notification inbox" value disabled />
          <Row
            label="Push notifications"
            subtitle="Get an alert the moment a matching opportunity is posted"
            value={prefs.channels.push}
            onValueChange={setPushEnabled}
            busy={busy}
          />
          <Row label="Email" subtitle="Coming soon" value={prefs.channels.email} disabled />
        </View>

        <Text style={styles.sectionTitle}>What to notify me about</Text>
        <View style={styles.card}>
          {NOTIFICATION_CATEGORIES.map((c) => (
            <Row key={c.key} label={c.label} value={!!prefs.categories[c.key]} onValueChange={(v) => toggleCategory(c.key, v)} />
          ))}
        </View>

        <Text style={styles.help}>
          Deadline reminders for specific saved opportunities are set individually — tap &ldquo;Remind me&rdquo; on the opportunity itself.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, subtitle, value, onValueChange, disabled, busy }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {busy ? (
        <ActivityIndicator color={colors.chrome} />
      ) : (
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled || !onValueChange}
          trackColor={{ true: colors.accent, false: colors.hairline }}
        />
      )}
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    content: { padding: 20, paddingBottom: 110 }, // clears the floating bottom tab bar
    sectionTitle: { color: colors.steel, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8, marginTop: 18 },
    card: {
      backgroundColor: colors.onyxRaised,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.hairline,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    rowLabel: { color: colors.chrome, fontSize: 14, fontWeight: "600" },
    rowSubtitle: { color: colors.steel, fontSize: 11.5, marginTop: 2 },
    help: { color: colors.steel, fontSize: 12, marginTop: 16, lineHeight: 17 },
  });
