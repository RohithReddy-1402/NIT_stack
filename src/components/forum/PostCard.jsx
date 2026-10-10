import Avatar from "@/components/forum/Avatar";
import ImageGallery from "@/components/forum/ImageGallery";
import Markdown from "@/components/forum/Markdown";
import VoteControl from "@/components/forum/VoteControl";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useForumGate } from "@/hooks/forum/useForumProfile";
import { usePostActions } from "@/hooks/forum/usePostActions";
import { castPostVote, usePostState } from "@/services/forumStore";
import { compactNumber, stripHtml, timeAgo } from "@/utils/forumFormat";
import { router } from "expo-router";
import { Ellipsis, ExternalLink, Lock, MessageSquare, Pin, Share2 } from "lucide-react-native";
import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

export const postHref = (post) => `/forum/c/${post.community.name}/p/${post.id}`;

// Screen gutter (16) + card padding (14), each side.
const CARD_INSET = 60;

/**
 * Feed item. `showCommunity` shows c/name (feeds) instead of the author
 * first (community page). Returns null once the post leaves the viewer's lists.
 */
function PostCard({ post, showCommunity = true, isMod = false }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { token } = useAuth();
  const { ensureMember, handleError } = useForumGate();
  const live = usePostState(post);
  const { width } = useWindowDimensions();
  const { openMenu, share, elements } = usePostActions(post, { isMod });

  if (live.gone) return null;

  const open = () => router.push(postHref(post));
  const vote = (value) => {
    if (!ensureMember()) return;
    castPostVote(token, post, value).catch((error) => handleError(error, "Couldn't vote"));
  };

  // See CommentRow: never let a `.handle` read reach the React Compiler's memo
  // dependencies, or anonymous posts (author === null) crash the card.
  const authorHandle = post.author?.handle ?? null;
  const authorLabel = post.isAnonymous ? "Anonymous" : authorHandle ? `u/${authorHandle}` : "[deleted]";

  return (
    <Pressable onPress={open} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.header}>
        {showCommunity ? (
          <Pressable style={styles.headerMain} onPress={() => router.push(`/forum/c/${post.community.name}`)} hitSlop={4}>
            <Avatar name={post.community.name} url={post.community.iconUrl} size={22} square />
            <Text style={styles.community} numberOfLines={1}>c/{post.community.name}</Text>
            <Text style={styles.meta}>· {timeAgo(post.createdAt)}</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.headerMain}
            onPress={() => authorHandle && router.push(`/forum/u/${authorHandle}`)}
            disabled={!authorHandle}
            hitSlop={4}
          >
            <Avatar name={post.author?.handle} url={post.author?.avatarUrl} anonymous={post.isAnonymous} size={22} />
            <Text style={styles.author} numberOfLines={1}>{authorLabel}</Text>
            <Text style={styles.meta}>· {timeAgo(post.createdAt)}</Text>
          </Pressable>
        )}
        {post.isPinned && !showCommunity ? <Pin size={14} color={colors.success} /> : null}
        {post.isLocked ? <Lock size={13} color={colors.steel} /> : null}
        <TouchableOpacity onPress={openMenu} hitSlop={10} accessibilityLabel="More options">
          <Ellipsis size={18} color={colors.steel} />
        </TouchableOpacity>
      </View>

      {showCommunity ? (
        <Text style={styles.byline} numberOfLines={1}>{authorLabel}</Text>
      ) : null}

      <Text style={styles.title}>{post.title}</Text>

      {post.kind === "link" && post.url ? (
        <View style={styles.linkRow}>
          <ExternalLink size={13} color={colors.accent} />
          <Text style={styles.linkText} numberOfLines={1}>{post.url.replace(/^https?:\/\/(www\.)?/, "")}</Text>
        </View>
      ) : null}

      {post.images?.length ? (
        <View style={styles.media}>
          <ImageGallery images={post.images} preview width={width - CARD_INSET} />
        </View>
      ) : post.body && post.bodyFormat === "html" ? (
        <View style={styles.preview}>
          <Text style={styles.previewText} numberOfLines={3}>{stripHtml(post.body)}</Text>
        </View>
      ) : post.body ? (
        <View style={styles.preview}>
          <Markdown numberOfLines={3} size={14}>{post.body}</Markdown>
        </View>
      ) : null}

      <View style={styles.footer}>
        <VoteControl score={live.score} myVote={live.myVote} onVote={vote} compact />
        <TouchableOpacity style={styles.chip} onPress={open} accessibilityLabel="Comments">
          <MessageSquare size={16} color={colors.silver} strokeWidth={1.8} />
          <Text style={styles.chipText}>{compactNumber(live.commentCount)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chip} onPress={share} accessibilityLabel="Share">
          <Share2 size={16} color={colors.silver} strokeWidth={1.8} />
          <Text style={styles.chipText}>Share</Text>
        </TouchableOpacity>
      </View>
      {elements}
    </Pressable>
  );
}

export default memo(PostCard);

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.onyxRaised,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: 14,
      marginBottom: 10,
    },
    pressed: { opacity: 0.85 },
    header: { flexDirection: "row", alignItems: "center", gap: 8 },
    headerMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 7 },
    community: { color: colors.chrome, fontSize: 13, fontWeight: "700", flexShrink: 1 },
    author: { color: colors.silver, fontSize: 13, fontWeight: "600", flexShrink: 1 },
    meta: { color: colors.steel, fontSize: 12 },
    byline: { color: colors.steel, fontSize: 12, marginTop: 4, marginLeft: 29 },
    title: { color: colors.chrome, fontSize: 16.5, fontWeight: "700", lineHeight: 22, marginTop: 8 },
    linkRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
    linkText: { color: colors.accent, fontSize: 13, flex: 1 },
    preview: { marginTop: 6 },
    previewText: { color: colors.silver, fontSize: 14, lineHeight: 20 },
    media: { marginTop: 10 },
    footer: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      height: 30,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
    },
    chipText: { color: colors.silver, fontSize: 13, fontWeight: "600" },
  });
