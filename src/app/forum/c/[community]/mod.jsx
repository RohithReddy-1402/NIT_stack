import ForumTopBar from "@/components/forum/ForumTopBar";
import Markdown from "@/components/forum/Markdown";
import { EmptyState } from "@/components/forum/States";
import { REPORT_REASONS } from "@/components/forum/ReportSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useForumGate } from "@/hooks/forum/useForumProfile";
import { useInfiniteList } from "@/hooks/forum/useInfiniteList";
import {
  addModerator,
  fetchBans,
  fetchCommunity,
  fetchModLog,
  fetchModQueue,
  moderate,
  unbanHandle,
  unbanRef,
  updateCommunity,
} from "@/services/forum";
import { confirm } from "@/utils/confirm";
import { timeAgo } from "@/utils/forumFormat";
import { router, useLocalSearchParams } from "expo-router";
import { ShieldCheck } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TABS = ["queue", "log", "bans", "settings"];
const TAB_LABELS = { queue: "Queue", log: "Log", bans: "Bans", settings: "Settings" };
const reasonLabel = (r) => REPORT_REASONS.find((x) => x.value === r)?.label ?? r;

export default function ModTools() {
  const { community: name } = useLocalSearchParams();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [tab, setTab] = useState("queue");

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ForumTopBar title="Mod tools" subtitle={`c/${name}`} />
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabOn]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{TAB_LABELS[t]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === "queue" ? <Queue name={name} styles={styles} colors={colors} /> : null}
      {tab === "log" ? <Log name={name} styles={styles} colors={colors} /> : null}
      {tab === "bans" ? <Bans name={name} styles={styles} colors={colors} /> : null}
      {tab === "settings" ? <Settings name={name} styles={styles} colors={colors} /> : null}
    </SafeAreaView>
  );
}

function Queue({ name, styles, colors }) {
  const { token } = useAuth();
  const { addToast } = useToast();
  const { handleError } = useForumGate();
  const list = useInfiniteList((cursor) => fetchModQueue(token, name, { cursor }), `${name}|${token}`);

  const act = async (item, action, message, body) => {
    const target = item.post ?? item.comment;
    try {
      await moderate(token, item.type, target.id, action, body);
      addToast(message, "success");
      // Approve/remove resolve the item's reports, so it leaves the queue.
      if (action !== "ban-author") list.setItems((items) => items.filter((x) => x !== item));
    } catch (error) {
      handleError(error, "Moderator action failed");
    }
  };

  return (
    <FlatList
      data={list.items}
      keyExtractor={(x) => `${x.type}-${(x.post ?? x.comment)?.id}`}
      renderItem={({ item }) => {
        const target = item.post ?? item.comment;
        if (!target) return null;
        const postLink = item.type === "post" ? `/forum/c/${name}/p/${target.id}` : `/forum/c/${name}/p/${target.postId}`;
        return (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.kind}>{item.type === "post" ? "POST" : "COMMENT"}</Text>
              <Text style={styles.reports}>{item.reportCount} report{item.reportCount === 1 ? "" : "s"} · {timeAgo(item.lastReportedAt)}</Text>
            </View>
            <View style={styles.reasons}>
              {item.reasons.map((r) => (
                <Text key={r} style={styles.reason}>{reasonLabel(r)}</Text>
              ))}
            </View>
            {item.details.slice(0, 3).map((d, i) => (
              <Text key={i} style={styles.detail}>“{d}”</Text>
            ))}
            <TouchableOpacity onPress={() => router.push(postLink)} style={styles.preview}>
              <Text style={styles.previewMeta}>
                {target.isAnonymous ? "Anonymous" : target.author ? `u/${target.author.handle}` : "[deleted]"}
                {target.isRemoved ? " · currently hidden" : ""}
                {item.type === "comment" ? ` · on “${target.postTitle}”` : ""}
              </Text>
              {item.type === "post" ? <Text style={styles.previewTitle}>{target.title}</Text> : null}
              {target.body ? <Markdown size={13.5} numberOfLines={4}>{target.body}</Markdown> : null}
            </TouchableOpacity>
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.actBtn, styles.approve]} onPress={() => act(item, "approve", "Approved")}>
                <Text style={styles.approveText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actBtn, styles.remove]} onPress={() => act(item, "remove", "Removed", { reason: "" })}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actBtn}
                onPress={async () => {
                  if (await confirm("Ban the author for 7 days?", target.isAnonymous ? "Works without revealing who they are." : undefined, { confirmLabel: "Ban", destructive: true })) {
                    act(item, "ban-author", "Author banned for 7 days", { reason: reasonLabel(item.reasons[0]), days: 7 });
                  }
                }}
              >
                <Text style={styles.actText}>Ban 7d</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
      ListEmptyComponent={
        list.loading ? (
          <ActivityIndicator color={colors.chrome} style={{ marginTop: 30 }} />
        ) : list.failed ? (
          <EmptyState title="Couldn't load the queue" subtitle={list.error?.message} actionLabel="Retry" onAction={list.reload} />
        ) : (
          <EmptyState icon={ShieldCheck} title="Queue is clear" subtitle="Reported posts and comments show up here." />
        )
      }
      onEndReached={list.loadMore}
      refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={colors.chrome} />}
      contentContainerStyle={styles.content}
    />
  );
}

const LOG_LABELS = {
  create_community: "created the community",
  update_community: "updated settings",
  add_moderator: "added moderator",
  remove_moderator: "removed moderator",
  remove_post: "removed a post",
  remove_comment: "removed a comment",
  approve_post: "approved a post",
  approve_comment: "approved a comment",
  auto_hide: "auto-hid reported content",
  pin: "pinned a post",
  unpin: "unpinned a post",
  lock: "locked a post",
  unlock: "unlocked a post",
  ban: "banned",
  ban_author: "banned an author",
  unban: "unbanned",
};

function Log({ name, styles, colors }) {
  const { token } = useAuth();
  const list = useInfiniteList((cursor) => fetchModLog(token, name, { cursor }), `${name}|${token}`);
  return (
    <FlatList
      data={list.items}
      keyExtractor={(x, i) => `${x.createdAt}-${i}`}
      renderItem={({ item }) => (
        <View style={styles.logRow}>
          <Text style={styles.logText}>
            <Text style={styles.logActor}>{item.actor === "system" ? "System" : item.actor ? `u/${item.actor}` : "Admin"}</Text>{" "}
            {LOG_LABELS[item.action] ?? item.action}
            {item.targetType === "user" && item.targetId ? ` u/${item.targetId}` : ""}
          </Text>
          {item.reason ? <Text style={styles.logReason}>{item.reason}</Text> : null}
          <Text style={styles.logTime}>{timeAgo(item.createdAt)}</Text>
        </View>
      )}
      ListEmptyComponent={list.loading ? <ActivityIndicator color={colors.chrome} style={{ marginTop: 30 }} /> : <EmptyState title="No moderator actions yet" />}
      onEndReached={list.loadMore}
      contentContainerStyle={styles.content}
    />
  );
}

function Bans({ name, styles, colors }) {
  const { token } = useAuth();
  const { addToast } = useToast();
  const { handleError } = useForumGate();
  const [items, setItems] = useState(null);

  const load = useCallback(() => {
    fetchBans(token, name).then((r) => setItems(r.items)).catch((e) => {
      setItems([]);
      handleError(e, "Couldn't load bans");
    });
  }, [token, name, handleError]);

  useEffect(() => {
    load();
  }, [load]);

  const unban = async (b) => {
    try {
      if (b.handle) await unbanHandle(token, name, b.handle);
      else await unbanRef(token, name, b.viaRef);
      setItems((list) => list.filter((x) => x !== b));
      addToast("Unbanned", "success");
    } catch (e) {
      handleError(e, "Couldn't unban");
    }
  };

  if (items === null) return <ActivityIndicator color={colors.chrome} style={{ marginTop: 30 }} />;
  return (
    <FlatList
      data={items}
      keyExtractor={(b) => b.handle ?? b.viaRef}
      renderItem={({ item: b }) => (
        <View style={styles.banRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.banName}>{b.handle ? `u/${b.handle}` : `Anonymous author (${b.viaRef?.startsWith("c:") ? "comment" : "post"})`}</Text>
            <Text style={styles.banMeta}>
              {b.reason || "No reason"} · {b.expiresAt ? `until ${new Date(b.expiresAt).toDateString()}` : "permanent"}
            </Text>
          </View>
          <TouchableOpacity style={styles.actBtn} onPress={() => unban(b)}>
            <Text style={styles.actText}>Unban</Text>
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={<EmptyState title="Nobody is banned" />}
      contentContainerStyle={styles.content}
    />
  );
}

function Settings({ name, styles, colors }) {
  const { token } = useAuth();
  const { addToast } = useToast();
  const { handleError } = useForumGate();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modHandle, setModHandle] = useState("");

  useEffect(() => {
    fetchCommunity(token, name)
      .then((c) => setForm({ title: c.title, description: c.description, restricted: c.type === "restricted", allowImages: c.allowImages, isOwner: c.myRole === "owner" }))
      .catch((e) => handleError(e, "Couldn't load settings"));
  }, [token, name, handleError]);

  if (!form) return <ActivityIndicator color={colors.chrome} style={{ marginTop: 30 }} />;

  const save = async () => {
    setSaving(true);
    try {
      await updateCommunity(token, name, {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.restricted ? "restricted" : "public",
        allowImages: form.allowImages,
      });
      addToast("Settings saved", "success");
    } catch (e) {
      handleError(e, "Couldn't save settings");
    } finally {
      setSaving(false);
    }
  };

  const addMod = async () => {
    try {
      const r = await addModerator(token, name, modHandle.trim().replace(/^u\//, ""));
      addToast(`u/${r.handle} is now a moderator`, "success");
      setModHandle("");
    } catch (e) {
      handleError(e, "Couldn't add moderator");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} maxLength={100} />
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, { minHeight: 90 }]}
        value={form.description}
        onChangeText={(v) => setForm({ ...form, description: v })}
        maxLength={500}
        multiline
        textAlignVertical="top"
      />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Only moderators can post</Text>
        <Switch value={form.restricted} onValueChange={(v) => setForm({ ...form, restricted: v })} />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Allow image posts</Text>
        <Switch value={form.allowImages} onValueChange={(v) => setForm({ ...form, allowImages: v })} />
      </View>
      <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving || !form.title.trim()}>
        {saving ? <ActivityIndicator color={colors.void} /> : <Text style={styles.saveText}>Save settings</Text>}
      </TouchableOpacity>
      <Text style={styles.help}>Rules can be viewed on the About page. Rule editing is coming soon.</Text>

      {form.isOwner ? (
        <>
          <Text style={[styles.label, { marginTop: 24 }]}>Add a moderator</Text>
          <View style={styles.modRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={modHandle}
              onChangeText={setModHandle}
              placeholder="username"
              placeholderTextColor={colors.steel}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.actBtn} onPress={addMod} disabled={!modHandle.trim()}>
              <Text style={styles.actText}>Add</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
    tab: { height: 32, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.hairline, justifyContent: "center" },
    tabOn: { backgroundColor: colors.chrome, borderColor: colors.chrome },
    tabText: { color: colors.silver, fontWeight: "600", fontSize: 13 },
    tabTextOn: { color: colors.void },
    content: { padding: 16, paddingBottom: 140 },
    card: {
      backgroundColor: colors.onyxRaised,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: 14,
      marginBottom: 12,
      gap: 8,
    },
    cardHead: { flexDirection: "row", justifyContent: "space-between" },
    kind: { color: colors.steel, fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },
    reports: { color: colors.danger, fontSize: 12, fontWeight: "600" },
    reasons: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    reason: {
      color: colors.chrome,
      fontSize: 11.5,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: 8,
      paddingHorizontal: 7,
      paddingVertical: 2,
      overflow: "hidden",
    },
    detail: { color: colors.silver, fontSize: 12.5, fontStyle: "italic" },
    preview: { borderRadius: 12, backgroundColor: colors.glassFill, padding: 10, gap: 4 },
    previewMeta: { color: colors.steel, fontSize: 12 },
    previewTitle: { color: colors.chrome, fontWeight: "700", fontSize: 14.5 },
    actions: { flexDirection: "row", gap: 8 },
    actBtn: { height: 34, paddingHorizontal: 14, borderRadius: 17, borderWidth: 1, borderColor: colors.hairline, justifyContent: "center" },
    actText: { color: colors.chrome, fontWeight: "600", fontSize: 13 },
    approve: { borderColor: colors.success },
    approveText: { color: colors.success, fontWeight: "700", fontSize: 13 },
    remove: { borderColor: colors.danger },
    removeText: { color: colors.danger, fontWeight: "700", fontSize: 13 },
    logRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.hairline, gap: 2 },
    logText: { color: colors.silver, fontSize: 13.5 },
    logActor: { color: colors.chrome, fontWeight: "700" },
    logReason: { color: colors.steel, fontSize: 12.5 },
    logTime: { color: colors.steel, fontSize: 11.5 },
    banRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.hairline },
    banName: { color: colors.chrome, fontSize: 14.5, fontWeight: "600" },
    banMeta: { color: colors.steel, fontSize: 12.5, marginTop: 2 },
    label: { color: colors.chrome, fontSize: 14, fontWeight: "700", marginTop: 10, marginBottom: 6 },
    input: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
      color: colors.chrome,
      padding: 12,
      fontSize: 14.5,
    },
    switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 },
    switchLabel: { color: colors.chrome, fontSize: 14.5 },
    saveBtn: { marginTop: 18, height: 46, borderRadius: 14, backgroundColor: colors.chrome, alignItems: "center", justifyContent: "center" },
    saveText: { color: colors.void, fontWeight: "700", fontSize: 15 },
    help: { color: colors.steel, fontSize: 12, marginTop: 8 },
    modRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  });
