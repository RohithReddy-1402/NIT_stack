import Avatar from "@/components/forum/Avatar";
import ForumTopBar from "@/components/forum/ForumTopBar";
import Markdown from "@/components/forum/Markdown";
import { EmptyState } from "@/components/forum/States";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { fetchCommunity, fetchModerators } from "@/services/forum";
import { compactNumber } from "@/utils/forumFormat";
import { format } from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CommunityAbout() {
  const { community: name } = useLocalSearchParams();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    Promise.all([fetchCommunity(token, name), fetchModerators(token, name)])
      .then(([community, mods]) => {
        setError(null);
        setData({ community, mods: mods.items });
      })
      .catch(setError);
  }, [token, name]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ForumTopBar title={`About c/${name}`} />
      {error ? (
        <EmptyState title="Couldn't load" subtitle={error.message} actionLabel="Retry" onAction={load} />
      ) : !data ? (
        <ActivityIndicator color={colors.chrome} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{data.community.title}</Text>
            {data.community.description ? <Markdown size={14.5}>{data.community.description}</Markdown> : null}
            <View style={styles.stats}>
              <Stat label="Members" value={compactNumber(data.community.memberCount)} styles={styles} />
              <Stat label="Posts" value={compactNumber(data.community.postCount)} styles={styles} />
              <Stat label="Created" value={format(new Date(data.community.createdAt), "MMM yyyy")} styles={styles} />
            </View>
          </View>

          <Text style={styles.section}>RULES</Text>
          {data.community.rules.length ? (
            data.community.rules.map((rule, i) => (
              <View key={i} style={styles.rule}>
                <Text style={styles.ruleTitle}>{i + 1}. {rule.title}</Text>
                {rule.body ? <Text style={styles.ruleBody}>{rule.body}</Text> : null}
              </View>
            ))
          ) : (
            <Text style={styles.muted}>No community-specific rules. The forum guidelines always apply.</Text>
          )}

          <Text style={styles.section}>MODERATORS</Text>
          {data.mods.map((m) => (
            <TouchableOpacity key={m.handle} style={styles.mod} onPress={() => router.push(`/forum/u/${m.handle}`)}>
              <Avatar name={m.handle} size={30} />
              <Text style={styles.modName}>u/{m.handle}</Text>
              <Text style={styles.modRole}>{m.role === "owner" ? "Owner" : "Moderator"}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const Stat = ({ label, value, styles }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    content: { padding: 16, paddingBottom: 140 },
    card: {
      backgroundColor: colors.onyxRaised,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: 16,
      gap: 10,
    },
    cardTitle: { color: colors.chrome, fontSize: 17, fontWeight: "700" },
    stats: { flexDirection: "row", marginTop: 6 },
    stat: { flex: 1 },
    statValue: { color: colors.chrome, fontSize: 16, fontWeight: "700" },
    statLabel: { color: colors.steel, fontSize: 12, marginTop: 2 },
    section: { color: colors.steel, fontSize: 12, fontWeight: "700", letterSpacing: 0.6, marginTop: 24, marginBottom: 10 },
    rule: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.hairline },
    ruleTitle: { color: colors.chrome, fontSize: 14.5, fontWeight: "600" },
    ruleBody: { color: colors.silver, fontSize: 13.5, marginTop: 4, lineHeight: 19 },
    muted: { color: colors.steel, fontSize: 13.5 },
    mod: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
    modName: { color: colors.chrome, fontSize: 14.5, fontWeight: "600", flex: 1 },
    modRole: { color: colors.steel, fontSize: 12.5 },
  });
