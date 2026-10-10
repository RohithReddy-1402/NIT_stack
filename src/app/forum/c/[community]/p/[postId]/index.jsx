import ActionSheet from "@/components/forum/ActionSheet";
import Avatar from "@/components/forum/Avatar";
import CommentRow, { MoreRepliesRow } from "@/components/forum/CommentRow";
import EditModal from "@/components/forum/EditModal";
import ForumTopBar from "@/components/forum/ForumTopBar";
import ImageGallery from "@/components/forum/ImageGallery";
import Markdown from "@/components/forum/Markdown";
import RichTextViewer from "@/components/forum/RichTextViewer";
import ReplyComposer from "@/components/forum/ReplyComposer";
import ReportSheet from "@/components/forum/ReportSheet";
import { EmptyState, PostSkeleton } from "@/components/forum/States";
import VoteControl from "@/components/forum/VoteControl";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useForumGate } from "@/hooks/forum/useForumProfile";
import { useInfiniteList } from "@/hooks/forum/useInfiniteList";
import { usePostActions } from "@/hooks/forum/usePostActions";
import {
  blockCommentAuthor,
  createComment,
  deleteComment,
  editComment,
  editPost,
  fetchComments,
  fetchPost,
  fetchReplies,
  moderate,
  reportContent,
  voteComment,
} from "@/services/forum";
import { castPostVote, patchPost, seedPosts, usePostState } from "@/services/forumStore";
import { copyLink } from "@/services/forumShare";
import { findComment, flattenComments, updateComment } from "@/utils/commentTree";
import { confirm } from "@/utils/confirm";
import { compactNumber, timeAgo } from "@/utils/forumFormat";
import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  Ban,
  Bookmark,
  BookmarkCheck,
  CircleCheck,
  Copy,
  Ellipsis,
  ExternalLink,
  Flag,
  Lock,
  MessageCircle,
  MessagesSquare,
  Pencil,
  Share2,
  ShieldX,
  Trash2,
  UserX,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COMMENT_SORTS = [
  { value: "best", label: "Best" },
  { value: "top", label: "Top" },
  { value: "new", label: "New" },
  { value: "old", label: "Old" },
];

export default function PostScreen() {
  const { postId } = useLocalSearchParams();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { token } = useAuth();
  const { addToast } = useToast();
  const { ensureMember, handleError } = useForumGate();
  const { width } = useWindowDimensions();
  const composerRef = useRef(null);

  const [post, setPost] = useState(null);
  const [isMod, setIsMod] = useState(false);
  const [postError, setPostError] = useState(null);
  const [sort, setSort] = useState("best");
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [replyTo, setReplyTo] = useState(null); // { id, label }
  const [loadingMore, setLoadingMore] = useState(null); // comment id
  const [editing, setEditing] = useState(null); // { kind: "post" } | { kind: "comment", comment }
  const [commentMenu, setCommentMenu] = useState(null); // comment
  const [reporting, setReporting] = useState(null); // comment

  const loadPost = useCallback(
    () =>
      fetchPost(token, postId)
        .then((data) => {
          setPostError(null);
          seedPosts([data.post]);
          setPost(data.post);
          setIsMod(data.viewerIsMod);
        })
        .catch(setPostError),
    [token, postId],
  );

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const comments = useInfiniteList(
    (cursor) => fetchComments(token, postId, { sort, cursor }),
    `${postId}|${sort}|${token ?? ""}`,
  );
  const setTree = comments.setItems;

  const live = usePostState(post);
  const { openMenu, share, toggleSave, elements: postSheets } = usePostActions(post, {
    isMod,
    onGone: () => (router.canGoBack() ? router.back() : router.replace("/forum")),
    onChanged: loadPost,
    onEdit: () => setEditing({ kind: "post" }),
  });

  const rows = useMemo(() => flattenComments(comments.items, collapsed), [comments.items, collapsed]);

  // ------------------------------------------------------------ actions
  const votePost = (value) => {
    if (!ensureMember()) return;
    castPostVote(token, post, value).catch((error) => handleError(error, "Couldn't vote"));
  };

  const voteOnComment = useCallback(
    async (comment, value) => {
      if (!ensureMember()) return;
      const before = { score: comment.score, myVote: comment.myVote };
      setTree((items) => updateComment(items, comment.id, (c) => ({ ...c, myVote: value, score: c.score + (value - c.myVote) })));
      try {
        const result = await voteComment(token, comment.id, value);
        setTree((items) => updateComment(items, comment.id, (c) => ({ ...c, ...result })));
      } catch (error) {
        setTree((items) => updateComment(items, comment.id, (c) => ({ ...c, ...before })));
        handleError(error, "Couldn't vote");
      }
    },
    [token, ensureMember, handleError, setTree],
  );

  const toggleCollapsed = useCallback((id) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const startReply = useCallback(
    (comment) => {
      if (!ensureMember()) return;
      const handle = comment.author?.handle;
      setReplyTo({ id: comment.id, label: comment.isAnonymous ? "Anonymous" : handle ? `u/${handle}` : "a comment" });
      setTimeout(() => composerRef.current?.focus(), 50);
    },
    [ensureMember],
  );

  const submitComment = async (body, isAnonymous) => {
    if (!ensureMember()) throw new Error("not a member");
    try {
      const created = await createComment(token, postId, { body, isAnonymous, parentId: replyTo?.id });
      if (replyTo) {
        setTree((items) =>
          updateComment(items, replyTo.id, (c) => ({ ...c, replyCount: c.replyCount + 1, replies: [created, ...(c.replies || [])] })),
        );
        setCollapsed((prev) => {
          const next = new Set(prev);
          next.delete(replyTo.id);
          return next;
        });
      } else {
        setTree((items) => [created, ...items]);
      }
      patchPost(postId, { commentCount: live.commentCount + 1 });
      setReplyTo(null);
    } catch (error) {
      handleError(error, "Couldn't post your comment");
      throw error;
    }
  };

  const loadMoreReplies = async (comment) => {
    setLoadingMore(comment.id);
    try {
      const { comment: fresh } = await fetchReplies(token, comment.id, { sort });
      setTree((items) => updateComment(items, comment.id, (c) => ({ ...c, replies: fresh.replies, moreReplies: fresh.moreReplies })));
    } catch (error) {
      handleError(error, "Couldn't load replies");
    } finally {
      setLoadingMore(null);
    }
  };

  const commentAction = (fn, fallback) => async () => {
    try {
      await fn();
    } catch (error) {
      handleError(error, fallback);
    }
  };

  const menuComment = commentMenu && findComment(comments.items, commentMenu.id);
  const menuCommentHandle = menuComment?.author?.handle ?? null;
  const commentActions = menuComment
    ? [
        { key: "reply", label: "Reply", icon: MessageCircle, onPress: () => startReply(menuComment), hidden: menuComment.isDeleted || menuComment.isRemoved || post?.isLocked },
        {
          key: "copy",
          label: "Copy text",
          icon: Copy,
          hidden: !menuComment.body,
          onPress: () => Clipboard.setStringAsync(menuComment.body).then(() => addToast("Copied", "success")),
        },
        { key: "edit", label: "Edit", icon: Pencil, hidden: !menuComment.isMine || menuComment.isDeleted || menuComment.isRemoved, onPress: () => setEditing({ kind: "comment", comment: menuComment }) },
        {
          key: "delete",
          label: "Delete",
          icon: Trash2,
          destructive: true,
          hidden: !menuComment.isMine || menuComment.isDeleted,
          onPress: async () => {
            if (!(await confirm("Delete this comment?", "Replies stay; your comment shows as deleted.", { confirmLabel: "Delete", destructive: true }))) return;
            commentAction(async () => {
              await deleteComment(token, menuComment.id);
              setTree((items) => updateComment(items, menuComment.id, (c) => ({ ...c, isDeleted: true, body: "", author: null })));
            }, "Couldn't delete")();
          },
        },
        { key: "report", label: "Report", icon: Flag, hidden: menuComment.isMine || menuComment.isDeleted, onPress: () => ensureMember() && setReporting(menuComment) },
        {
          key: "block",
          label: menuCommentHandle && !menuComment.isAnonymous ? `Block u/${menuCommentHandle}` : "Block this author",
          icon: UserX,
          destructive: true,
          hidden: menuComment.isMine || menuComment.isDeleted || menuComment.isBlocked,
          onPress: async () => {
            if (!ensureMember()) return;
            if (!(await confirm("Block this author?", menuComment.isAnonymous ? "Their anonymous content will be hidden. You won't be told who they are." : "Their posts and comments will be hidden.", { confirmLabel: "Block", destructive: true }))) return;
            commentAction(async () => {
              await blockCommentAuthor(token, menuComment.id);
              addToast("Author blocked", "success");
              comments.refresh();
            }, "Couldn't block")();
          },
        },
        { key: "approve", label: "Approve (restore)", icon: CircleCheck, hidden: !isMod || !menuComment.isRemoved, onPress: commentAction(async () => {
          await moderate(token, "comment", menuComment.id, "approve");
          setTree((items) => updateComment(items, menuComment.id, (c) => ({ ...c, isRemoved: false, removalReason: null })));
          addToast("Comment restored", "success");
        }, "Moderator action failed") },
        { key: "remove", label: "Remove comment", icon: ShieldX, destructive: true, hidden: !isMod || menuComment.isRemoved || menuComment.isDeleted, onPress: commentAction(async () => {
          await moderate(token, "comment", menuComment.id, "remove", { reason: "" });
          setTree((items) => updateComment(items, menuComment.id, (c) => ({ ...c, isRemoved: true })));
          addToast("Comment removed", "success");
        }, "Moderator action failed") },
        { key: "ban", label: "Ban author from community", icon: Ban, destructive: true, hidden: !isMod || menuComment.isMine || menuComment.isDeleted, onPress: async () => {
          if (!(await confirm("Ban this author for 7 days?", undefined, { confirmLabel: "Ban", destructive: true }))) return;
          commentAction(async () => {
            await moderate(token, "comment", menuComment.id, "ban-author", { reason: "Rule violation", days: 7 });
            addToast("Author banned for 7 days", "success");
          }, "Moderator action failed")();
        } },
      ]
    : [];

  // ------------------------------------------------------------- render
  if (postError) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ForumTopBar title="Post" />
        <EmptyState
          title={postError.status === 404 ? "This post doesn't exist" : "Couldn't load this post"}
          subtitle={postError.status === 404 ? "It may have been removed along with its community." : postError.message}
          actionLabel={postError.status === 404 ? "Go to forum" : "Retry"}
          onAction={postError.status === 404 ? () => router.replace("/forum") : loadPost}
        />
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ForumTopBar title="Post" />
        <View style={{ padding: 16 }}><PostSkeleton /></View>
      </SafeAreaView>
    );
  }

  const postAuthorHandle = post.author?.handle ?? null;
  const authorLabel = post.isAnonymous ? "Anonymous" : postAuthorHandle ? `u/${postAuthorHandle}` : "[deleted]";
  const saved = live.saved;

  const header = (
    <View>
      <View style={styles.postBlock}>
        <View style={styles.metaRow}>
          <TouchableOpacity style={styles.metaMain} onPress={() => router.push(`/forum/c/${post.community.name}`)}>
            <Avatar name={post.community.name} url={post.community.iconUrl} size={30} square />
            <View style={{ flex: 1 }}>
              <Text style={styles.community}>c/{post.community.name}</Text>
              <Text style={styles.metaText} numberOfLines={1}>
                <Text
                  onPress={postAuthorHandle && !post.isAnonymous ? () => router.push(`/forum/u/${postAuthorHandle}`) : undefined}
                  style={postAuthorHandle && !post.isAnonymous ? styles.authorLink : null}
                >
                  {authorLabel}
                </Text>
                {` · ${timeAgo(post.createdAt)}${post.isEdited ? " · edited" : ""}`}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={openMenu} hitSlop={10} accessibilityLabel="More options">
            <Ellipsis size={20} color={colors.steel} />
          </TouchableOpacity>
        </View>

        {post.isRemoved ? (
          <View style={[styles.banner, { borderColor: colors.danger }]}>
            <ShieldX size={15} color={colors.danger} />
            <Text style={[styles.bannerText, { color: colors.danger }]}>
              {post.removalReason ? `Removed: ${post.removalReason}` : "Removed by moderators"}
            </Text>
          </View>
        ) : null}
        {post.isLocked ? (
          <View style={styles.banner}>
            <Lock size={14} color={colors.steel} />
            <Text style={styles.bannerText}>Comments are locked by moderators</Text>
          </View>
        ) : null}

        <Text style={styles.title} selectable>{post.title}</Text>

        {post.kind === "link" && post.url ? (
          <TouchableOpacity style={styles.linkCard} onPress={() => WebBrowser.openBrowserAsync(post.url).catch(() => {})}>
            <ExternalLink size={16} color={colors.accent} />
            <Text style={styles.linkText} numberOfLines={2}>{post.url}</Text>
          </TouchableOpacity>
        ) : null}

        {post.images?.length ? (
          <View style={{ marginTop: 12 }}>
            <ImageGallery images={post.images} width={width - 32} />
          </View>
        ) : null}

        {post.isDeleted ? (
          <Text style={styles.placeholder}>[deleted by author]</Text>
        ) : post.body && post.bodyFormat === "html" ? (
          <View style={{ marginTop: 12 }}>
            <RichTextViewer html={post.body} width={width - 32} />
          </View>
        ) : post.body ? (
          <View style={{ marginTop: 12 }}>
            <Markdown>{post.body}</Markdown>
          </View>
        ) : null}

        <View style={styles.footer}>
          <VoteControl score={live.score} myVote={live.myVote} onVote={votePost} disabled={post.isDeleted || post.isRemoved} />
          <View style={styles.chip}>
            <MessageCircle size={16} color={colors.silver} />
            <Text style={styles.chipText}>{compactNumber(live.commentCount)}</Text>
          </View>
          <TouchableOpacity style={styles.chip} onPress={share} disabled={post.isDeleted || post.isRemoved}>
            <Share2 size={16} color={colors.silver} />
            <Text style={styles.chipText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chip} onPress={toggleSave} accessibilityLabel={saved ? "Unsave" : "Save"}>
            {saved ? <BookmarkCheck size={16} color={colors.accent} /> : <Bookmark size={16} color={colors.silver} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
        {COMMENT_SORTS.map((s) => (
          <TouchableOpacity key={s.value} style={[styles.sortChip, sort === s.value && styles.sortChipOn]} onPress={() => setSort(s.value)}>
            <Text style={[styles.sortText, sort === s.value && styles.sortTextOn]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ForumTopBar
        title={`c/${post.community.name}`}
        subtitle={`${compactNumber(live.commentCount)} comments`}
        right={
          <TouchableOpacity onPress={() => copyLink(post.shareUrl).then(() => addToast("Link copied", "success"))} hitSlop={8} accessibilityLabel="Copy link">
            <Copy size={19} color={colors.chrome} />
          </TouchableOpacity>
        }
      />
      {/* SDK 57 forces Android edge-to-edge, so adjustResize no longer shrinks the
          layout for the keyboard — "padding" (backed by safe-area-context 5.x's
          IME insets) is required on both platforms now. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <FlatList
          data={rows}
          keyExtractor={(r) => r.key}
          ListHeaderComponent={header}
          renderItem={({ item }) =>
            item.type === "more" ? (
              <View style={styles.commentPad}>
                <MoreRepliesRow
                  depth={item.comment.depth}
                  count={item.count}
                  continueThread={item.continueThread}
                  loading={loadingMore === item.comment.id}
                  onPress={() => loadMoreReplies(item.comment)}
                />
              </View>
            ) : (
              <View style={styles.commentPad}>
                <CommentRow
                  comment={item.comment}
                  collapsed={collapsed.has(item.comment.id)}
                  onToggle={() => toggleCollapsed(item.comment.id)}
                  onVote={(v) => voteOnComment(item.comment, v)}
                  onReply={() => startReply(item.comment)}
                  onMenu={() => setCommentMenu(item.comment)}
                  canReply={!post.isLocked || isMod}
                />
              </View>
            )
          }
          ListEmptyComponent={
            comments.loading ? (
              <ActivityIndicator color={colors.chrome} style={{ marginTop: 24 }} />
            ) : comments.failed ? (
              <EmptyState title="Couldn't load comments" subtitle={comments.error?.message} actionLabel="Retry" onAction={comments.reload} />
            ) : (
              <EmptyState icon={MessagesSquare} title="No comments yet" subtitle="Start the conversation." />
            )
          }
          ListFooterComponent={
            comments.hasMore ? (
              <TouchableOpacity style={styles.loadMore} onPress={comments.loadMore} disabled={comments.loadingMore}>
                {comments.loadingMore ? <ActivityIndicator color={colors.chrome} /> : <Text style={styles.loadMoreText}>Load more comments</Text>}
              </TouchableOpacity>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={comments.refreshing}
              onRefresh={() => {
                loadPost();
                comments.refresh();
              }}
              tintColor={colors.chrome}
            />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        />
        <ReplyComposer
          ref={composerRef}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onSubmit={submitComment}
          onFocusAttempt={ensureMember}
          disabledReason={
            post.isDeleted || post.isRemoved
              ? "Comments are closed on this post"
              : post.isLocked && !isMod
                ? "Comments are locked"
                : null
          }
        />
      </KeyboardAvoidingView>

      {postSheets}
      <ActionSheet visible={!!menuComment} title="Comment" actions={commentActions} onClose={() => setCommentMenu(null)} />
      <ReportSheet
        visible={!!reporting}
        what="comment"
        onClose={() => setReporting(null)}
        onSubmit={async (reason, details) => {
          try {
            await reportContent(token, "comment", reporting.id, reason, details);
            addToast("Thanks — moderators will review it", "success");
          } catch (error) {
            handleError(error, "Couldn't send the report");
            throw error;
          }
        }}
      />
      <EditModal
        visible={!!editing}
        title={editing?.kind === "comment" ? "Edit comment" : "Edit post"}
        initial={editing?.kind === "comment" ? editing.comment.body : post.body}
        maxLength={editing?.kind === "comment" ? 10000 : 40000}
        allowEmpty={editing?.kind === "post"}
        richText={editing?.kind === "post" && post.bodyFormat === "html"}
        onClose={() => setEditing(null)}
        onSave={async (text) => {
          try {
            if (editing.kind === "comment") {
              const updated = await editComment(token, editing.comment.id, text);
              setTree((items) => updateComment(items, editing.comment.id, (c) => ({ ...c, body: updated.body, isEdited: true })));
            } else {
              const updated = await editPost(token, post.id, text);
              setPost((p) => ({ ...p, body: updated.body, isEdited: true }));
            }
            addToast("Saved", "success");
          } catch (error) {
            handleError(error, "Couldn't save");
            throw error;
          }
        }}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    postBlock: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.hairline },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    metaMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
    community: { color: colors.chrome, fontSize: 14, fontWeight: "700" },
    metaText: { color: colors.steel, fontSize: 12.5, marginTop: 1 },
    authorLink: { color: colors.silver, fontWeight: "600" },
    banner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 12,
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.hairline,
    },
    bannerText: { color: colors.steel, fontSize: 13, flex: 1 },
    title: { color: colors.chrome, fontSize: 21, fontWeight: "800", lineHeight: 28, marginTop: 12 },
    linkCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 12,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
    },
    linkText: { color: colors.accent, fontSize: 13.5, flex: 1 },
    placeholder: { color: colors.steel, fontStyle: "italic", marginTop: 12 },
    footer: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      height: 34,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
    },
    chipText: { color: colors.silver, fontSize: 13, fontWeight: "600" },
    sortRow: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
    sortChip: {
      height: 30,
      paddingHorizontal: 14,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.hairline,
      justifyContent: "center",
    },
    sortChipOn: { backgroundColor: colors.chrome, borderColor: colors.chrome },
    sortText: { color: colors.silver, fontSize: 13, fontWeight: "600" },
    sortTextOn: { color: colors.void },
    commentPad: { paddingHorizontal: 12 },
    loadMore: { alignItems: "center", paddingVertical: 16 },
    loadMoreText: { color: colors.accent, fontWeight: "700" },
  });
