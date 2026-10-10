import PickerSheet from "@/components/attendance/PickerSheet";
import Avatar from "@/components/forum/Avatar";
import ForumTopBar from "@/components/forum/ForumTopBar";
import { postHref } from "@/components/forum/PostCard";
import PostEditor, {
  TenTapStartKit,
  darkEditorTheme,
  defaultEditorTheme,
  useEditorBridge,
} from "@/components/forum/PostEditor";
import RichTextViewer from "@/components/forum/RichTextViewer";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useForumGate, useForumProfile } from "@/hooks/forum/useForumProfile";
import { createPost, fetchCommunities, fetchMyCommunities } from "@/services/forum";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronDown, Eye, EyeOff, Link2, MessageCircleOff, PenLine, VenetianMask } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Images used to be their own exclusive post "kind"; they're now inserted
// inline in the rich post body instead, so there are only two modes left: a
// blog-style rich post, or a bare link share.
const MODES = [
  { value: "post", label: "Write", icon: PenLine },
  { value: "link", label: "Link", icon: Link2 },
];

export default function SubmitPost() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { community: initialCommunity } = useLocalSearchParams();
  const { token, isLoggedIn, loading: authLoading } = useAuth();
  const { status } = useForumProfile();
  const { handleError } = useForumGate();
  const { addToast } = useToast();

  const [community, setCommunity] = useState(initialCommunity || null);
  const [options, setOptions] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mode, setMode] = useState("post"); // "post" (rich) | "link"
  const [title, setTitle] = useState("");
  const [body, setBody] = useState(""); // link mode's optional description
  const [url, setUrl] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [commentsOff, setCommentsOff] = useState(false);
  const [progress, setProgress] = useState(null); // text shown while submitting
  const [company, setCompany] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [previewOn, setPreviewOn] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const tags = useMemo(
    () => tagsInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 5),
    [tagsInput],
  );

  const editor = useEditorBridge({
    bridgeExtensions: TenTapStartKit,
    dynamicHeight: true,
    theme: isDark ? darkEditorTheme : defaultEditorTheme,
  });

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.replace("/login");
    else if (status === "none") router.replace("/forum/onboarding");
  }, [authLoading, isLoggedIn, status]);

  // Your communities first, then popular ones you haven't joined.
  useEffect(() => {
    if (!token) return;
    Promise.all([fetchMyCommunities(token), fetchCommunities(token, { sort: "popular", limit: 50 })])
      .then(([mine, popular]) => {
        const seen = new Set(mine.items.map((c) => c.name.toLowerCase()));
        setOptions([...mine.items, ...popular.items.filter((c) => !seen.has(c.name.toLowerCase()))]);
      })
      .catch(() => {});
  }, [token]);

  const ready = community && title.trim() && (mode !== "link" || url.trim()) && !progress;

  const submit = async () => {
    try {
      setProgress("Posting…");
      const post = await createPost(token, {
        community,
        kind: mode === "link" ? "link" : "text",
        bodyFormat: mode === "link" ? "markdown" : "html",
        title: title.trim(),
        body: mode === "link" ? body.trim() : await editor.getHTML(),
        url: mode === "link" ? url.trim() : undefined,
        isAnonymous: anonymous,
        commentsDisabled: commentsOff,
        company: company.trim() || undefined,
        tags,
      });
      addToast(post.status === "pending" ? "Submitted for review!" : "Posted!", "success");
      if (post.status === "pending") router.replace("/forum");
      else router.replace(postHref(post));
    } catch (error) {
      setProgress(null);
      handleError(error, "Couldn't create the post");
    }
  };

  const selected = options.find((c) => c.name.toLowerCase() === String(community || "").toLowerCase());
  const imagesAllowed = selected?.allowImages !== false;
  const requiresApproval = Boolean(selected?.requiresApproval);

  const togglePreview = async () => {
    if (!previewOn && mode === "post") setPreviewHtml(await editor.getHTML());
    setPreviewOn((v) => !v);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ForumTopBar
        title="Create post"
        right={
          <>
            {mode === "post" ? (
              <TouchableOpacity style={styles.previewBtn} onPress={togglePreview}>
                {previewOn ? <EyeOff size={18} color={colors.silver} /> : <Eye size={18} color={colors.silver} />}
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={[styles.postBtn, !ready && styles.off]} disabled={!ready} onPress={submit}>
              {progress ? <ActivityIndicator size="small" color={colors.void} /> : <Text style={styles.postBtnText}>Post</Text>}
            </TouchableOpacity>
          </>
        }
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {progress ? <Text style={styles.progress}>{progress}</Text> : null}

          <TouchableOpacity style={styles.communityBtn} onPress={() => setPickerOpen(true)}>
            {community ? <Avatar name={community} url={selected?.iconUrl} size={26} square /> : null}
            <Text style={[styles.communityText, !community && { color: colors.steel }]}>
              {community ? `c/${selected?.name ?? community}` : "Choose a community"}
            </Text>
            <ChevronDown size={18} color={colors.steel} />
          </TouchableOpacity>

          <View style={styles.kinds}>
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = mode === m.value;
              return (
                <TouchableOpacity
                  key={m.value}
                  style={[styles.kind, active && styles.kindOn]}
                  onPress={() => setMode(m.value)}
                >
                  <Icon size={16} color={active ? colors.void : colors.silver} />
                  <Text style={[styles.kindText, active && styles.kindTextOn]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={styles.title}
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={colors.steel}
            maxLength={300}
            multiline
          />
          <Text style={styles.counter}>{title.length}/300</Text>

          {requiresApproval ? (
            <>
              <TextInput
                style={styles.input}
                value={company}
                onChangeText={setCompany}
                placeholder="Company"
                placeholderTextColor={colors.steel}
                maxLength={120}
              />
              <TextInput
                style={styles.input}
                value={tagsInput}
                onChangeText={setTagsInput}
                placeholder="Tags, comma separated (e.g. oa, sde, dsa)"
                placeholderTextColor={colors.steel}
                autoCapitalize="none"
              />
              {tags.length ? (
                <View style={styles.tagRow}>
                  {tags.map((t) => (
                    <View key={t} style={styles.tagChip}>
                      <Text style={styles.tagChipText}>{t}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <Text style={styles.hint}>
                Posts here go to an admin for review and appear once approved.
              </Text>
            </>
          ) : null}

          {previewOn && mode === "post" ? (
            <View style={styles.preview}>
              <Text style={styles.previewTitle}>{title.trim() || "Untitled"}</Text>
              {company.trim() || tags.length ? (
                <View style={styles.tagRow}>
                  {company.trim() ? (
                    <View style={[styles.tagChip, styles.companyChip]}>
                      <Text style={[styles.tagChipText, styles.companyChipText]}>{company.trim()}</Text>
                    </View>
                  ) : null}
                  {tags.map((t) => (
                    <View key={t} style={styles.tagChip}>
                      <Text style={styles.tagChipText}>{t}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <RichTextViewer html={previewHtml} />
            </View>
          ) : mode === "link" ? (
            <>
              <TextInput
                style={styles.input}
                value={url}
                onChangeText={setUrl}
                placeholder="https://"
                placeholderTextColor={colors.steel}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <TextInput
                style={[styles.input, styles.body]}
                value={body}
                onChangeText={setBody}
                placeholder="Add a description (optional). **bold**, *italic*, - lists, > quotes"
                placeholderTextColor={colors.steel}
                multiline
                maxLength={40000}
                textAlignVertical="top"
              />
            </>
          ) : (
            <>
              <PostEditor editor={editor} allowImages={imagesAllowed} />
              {!imagesAllowed && community ? (
                <Text style={styles.hint}>{`c/${selected?.name ?? community} doesn't allow images — text formatting still works.`}</Text>
              ) : null}
            </>
          )}

          <View style={styles.anonRow}>
            <VenetianMask size={20} color={anonymous ? colors.accent : colors.steel} />
            <View style={{ flex: 1 }}>
              <Text style={styles.anonTitle}>Post anonymously</Text>
              <Text style={styles.anonSub}>Hides your username from everyone, including community moderators.</Text>
            </View>
            <Switch value={anonymous} onValueChange={setAnonymous} />
          </View>

          <View style={styles.anonRow}>
            <MessageCircleOff size={20} color={commentsOff ? colors.accent : colors.steel} />
            <View style={{ flex: 1 }}>
              <Text style={styles.anonTitle}>Turn off comments</Text>
              <Text style={styles.anonSub}>No one can reply to this post. A moderator can turn comments back on.</Text>
            </View>
            <Switch value={commentsOff} onValueChange={setCommentsOff} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PickerSheet
        visible={pickerOpen}
        title="Post to"
        options={options}
        getLabel={(c) => `c/${c.name}${c.myRole ? "" : `  ·  ${c.memberCount} members`}`}
        getValue={(c) => c.name}
        onSelect={(name) => {
          setCommunity(name);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    content: { padding: 16, paddingBottom: 160, gap: 12 },
    progress: { color: colors.accent, fontWeight: "600" },
    postBtn: {
      height: 34,
      paddingHorizontal: 16,
      borderRadius: 17,
      backgroundColor: colors.chrome,
      alignItems: "center",
      justifyContent: "center",
    },
    postBtnText: { color: colors.void, fontWeight: "700", fontSize: 14 },
    off: { opacity: 0.35 },
    previewBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    tagChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      backgroundColor: colors.onyxRaised,
    },
    companyChip: { backgroundColor: colors.chrome },
    tagChipText: { color: colors.silver, fontSize: 12, fontWeight: "600" },
    companyChipText: { color: colors.void },
    preview: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
      padding: 14,
      gap: 10,
    },
    previewTitle: { color: colors.chrome, fontSize: 19, fontWeight: "700" },
    communityBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      alignSelf: "flex-start",
      height: 42,
      paddingHorizontal: 12,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
    },
    communityText: { color: colors.chrome, fontWeight: "700", fontSize: 14 },
    kinds: { flexDirection: "row", gap: 8 },
    kind: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      height: 34,
      paddingHorizontal: 14,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    kindOn: { backgroundColor: colors.chrome, borderColor: colors.chrome },
    kindText: { color: colors.silver, fontWeight: "600", fontSize: 13 },
    kindTextOn: { color: colors.void },
    title: { color: colors.chrome, fontSize: 20, fontWeight: "700", paddingVertical: 6 },
    counter: { color: colors.steel, fontSize: 11, alignSelf: "flex-end", marginTop: -8 },
    input: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
      color: colors.chrome,
      padding: 14,
      fontSize: 15,
    },
    body: { minHeight: 160, lineHeight: 21 },
    hint: { color: colors.steel, fontSize: 12 },
    anonRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.onyxRaised,
    },
    anonTitle: { color: colors.chrome, fontWeight: "700", fontSize: 14.5 },
    anonSub: { color: colors.steel, fontSize: 12, marginTop: 2 },
  });
