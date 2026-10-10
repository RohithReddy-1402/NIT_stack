import Avatar from "@/components/forum/Avatar";
import Markdown from "@/components/forum/Markdown";
import VoteControl from "@/components/forum/VoteControl";
import { useTheme } from "@/contexts/ThemeContext";
import { countDescendants } from "@/utils/commentTree";
import { timeAgo } from "@/utils/forumFormat";
import { router } from "expo-router";
import { ChevronDown, CornerDownRight, Ellipsis, MessageCircle } from "lucide-react-native";
import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const RAIL = 18;
const MAX_RAILS = 6;

/** Left indent rails, one per depth level — thicker and more visible with depth. */
function Rails({ depth, colors }) {
  const n = Math.min(depth, MAX_RAILS);
  return Array.from({ length: n }, (_, i) => (
    <View key={i} style={{ width: RAIL, alignItems: "center" }}>
      <View style={{ width: i === n - 1 ? 2 : 1, flex: 1, backgroundColor: colors.accent, opacity: i === n - 1 ? 0.55 : 0.25 }} />
    </View>
  ));
}

function CommentRow({ comment, collapsed, onToggle, onVote, onReply, onMenu, canReply }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const placeholder = comment.isDeleted
    ? "[deleted]"
    : comment.isBlocked
      ? "Comment from a user you blocked"
      : comment.isRemoved && !comment.body
        ? "[removed by moderators]"
        : null;
  // Read through `author` once: with the React Compiler on, a `comment.author.handle`
  // inside a callback becomes a memo dependency that is read during render — which
  // crashes on anonymous/deleted authors, where `author` is null.
  const authorHandle = comment.author?.handle ?? null;
  const authorLabel = comment.isAnonymous ? "Anonymous" : authorHandle ?? "[deleted]";

  return (
    <View style={styles.row}>
      <Rails depth={comment.depth} colors={colors} />
      <Pressable style={styles.main} onPress={onToggle} accessibilityHint="Tap to collapse or expand the thread">
        <View style={styles.header}>
          <Pressable
            style={styles.authorBtn}
            disabled={!authorHandle || comment.isAnonymous}
            onPress={() => router.push(`/forum/u/${authorHandle}`)}
            hitSlop={4}
          >
            <Avatar name={comment.author?.handle} url={comment.author?.avatarUrl} anonymous={comment.isAnonymous} size={20} />
            <Text style={[styles.author, comment.isOp && styles.op]} numberOfLines={1}>{authorLabel}</Text>
          </Pressable>
          {comment.isOp ? <Text style={styles.opBadge}>OP</Text> : null}
          <Text style={styles.meta}>· {timeAgo(comment.createdAt)}{comment.isEdited ? " · edited" : ""}</Text>
          {collapsed ? (
            <View style={styles.collapsedBadge}>
              <ChevronDown size={12} color={colors.steel} />
              <Text style={styles.collapsedText}>{countDescendants(comment)}</Text>
            </View>
          ) : null}
        </View>

        {!collapsed ? (
          <>
            {placeholder ? (
              <Text style={styles.placeholder}>{placeholder}</Text>
            ) : (
              <View style={styles.body}>
                {comment.isRemoved ? <Text style={styles.removedNote}>Removed by moderators — only you and moderators see this.</Text> : null}
                <Markdown size={14.5}>{comment.body}</Markdown>
              </View>
            )}
            <View style={styles.actions}>
              <VoteControl
                score={comment.score}
                myVote={comment.myVote}
                onVote={onVote}
                disabled={comment.isDeleted || comment.isRemoved}
                compact
              />
              {canReply && !comment.isDeleted && !comment.isRemoved ? (
                <TouchableOpacity style={styles.action} onPress={onReply} hitSlop={6}>
                  <MessageCircle size={15} color={colors.steel} />
                  <Text style={styles.actionText}>Reply</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.action} onPress={onMenu} hitSlop={8} accessibilityLabel="More options">
                <Ellipsis size={17} color={colors.steel} />
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </Pressable>
    </View>
  );
}

export default memo(CommentRow);

/** "Load N more replies" / "Continue this thread" row. */
export function MoreRepliesRow({ depth, count, continueThread, loading, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  return (
    <View style={styles.row}>
      <Rails depth={depth + 1} colors={colors} />
      <TouchableOpacity style={styles.more} onPress={onPress} disabled={loading}>
        <CornerDownRight size={14} color={colors.accent} />
        <Text style={styles.moreText}>
          {loading ? "Loading…" : continueThread ? "Continue this thread" : `${count} more repl${count === 1 ? "y" : "ies"}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    row: { flexDirection: "row" },
    main: { flex: 1, paddingVertical: 8, paddingLeft: 6 },
    header: { flexDirection: "row", alignItems: "center", gap: 6 },
    authorBtn: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
    author: { color: colors.silver, fontSize: 12.5, fontWeight: "700", flexShrink: 1 },
    op: { color: colors.accent },
    opBadge: {
      color: colors.accent,
      fontSize: 10,
      fontWeight: "800",
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 4,
      paddingHorizontal: 4,
      overflow: "hidden",
    },
    meta: { color: colors.steel, fontSize: 12, flexShrink: 1 },
    collapsedBadge: { flexDirection: "row", alignItems: "center", gap: 2, marginLeft: "auto" },
    collapsedText: { color: colors.steel, fontSize: 12 },
    body: { marginTop: 5 },
    placeholder: { color: colors.steel, fontSize: 14, fontStyle: "italic", marginTop: 5 },
    removedNote: { color: colors.danger, fontSize: 12, marginBottom: 4 },
    actions: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 6 },
    action: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 4 },
    actionText: { color: colors.steel, fontSize: 13, fontWeight: "600" },
    more: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, paddingLeft: 6 },
    moreText: { color: colors.accent, fontSize: 13, fontWeight: "700" },
  });
