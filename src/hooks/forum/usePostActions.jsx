import ActionSheet from "@/components/forum/ActionSheet";
import ReportSheet from "@/components/forum/ReportSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useForumGate } from "@/hooks/forum/useForumProfile";
import {
  blockPostAuthor,
  deletePost,
  moderate,
  reportContent,
  setPostHidden,
  setPostSaved,
} from "@/services/forum";
import { copyLink, shareLink } from "@/services/forumShare";
import { getPostState, patchPost } from "@/services/forumStore";
import { confirm } from "@/utils/confirm";
import {
  Ban,
  Bookmark,
  BookmarkCheck,
  CircleCheck,
  EyeOff,
  Flag,
  Link2,
  Lock,
  LockOpen,
  Pencil,
  Pin,
  PinOff,
  Share2,
  ShieldX,
  Trash2,
  UserX,
} from "lucide-react-native";
import { useCallback, useState } from "react";

/**
 * All post actions in one place so the feed card and the post screen behave
 * identically. Returns `{ openMenu, share, toggleSave, elements }` — render
 * `elements` once. `isMod` adds moderator tools; `onGone` runs after the post
 * leaves the viewer's lists (hidden/deleted/blocked/removed); `onChanged`
 * after moderator changes that need a refetch; `onEdit` opens the editor.
 */
export function usePostActions(post, { isMod = false, onGone, onChanged, onEdit } = {}) {
  const { token } = useAuth();
  const { addToast } = useToast();
  const { ensureMember, handleError } = useForumGate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const saved = getPostState(post?.id)?.saved ?? post?.saved;
  // Same React Compiler caveat as CommentRow: keep `.handle` off memo dependencies.
  const authorHandle = post?.author?.handle ?? null;

  const share = useCallback(async () => {
    try {
      const result = await shareLink(post.title, post.shareUrl);
      if (result === "copied") addToast("Link copied", "success");
    } catch {
      addToast("Couldn't open the share sheet", "error");
    }
  }, [post, addToast]);

  const toggleSave = useCallback(async () => {
    if (!ensureMember()) return;
    const next = !(getPostState(post.id)?.saved ?? post.saved);
    patchPost(post.id, { saved: next });
    try {
      await setPostSaved(token, post.id, next);
      addToast(next ? "Saved" : "Removed from saved", "success");
    } catch (error) {
      patchPost(post.id, { saved: !next });
      handleError(error, "Couldn't update saved posts");
    }
  }, [post, token, ensureMember, handleError, addToast]);

  const gone = useCallback(
    (message) => {
      patchPost(post.id, { gone: true });
      addToast(message, "success");
      onGone?.();
    },
    [post, addToast, onGone],
  );

  const run = useCallback(
    async (fn, fallback) => {
      try {
        await fn();
      } catch (error) {
        handleError(error, fallback);
      }
    },
    [handleError],
  );

  const mod = (action, message, body) =>
    run(async () => {
      await moderate(token, "post", post.id, action, body);
      addToast(message, "success");
      onChanged?.();
    }, "Moderator action failed");

  if (!post) return { openMenu: () => {}, share, toggleSave, elements: null };

  const member = (fn) => () => ensureMember() && fn();
  const actions = [
    { key: "save", label: saved ? "Unsave" : "Save", icon: saved ? BookmarkCheck : Bookmark, onPress: toggleSave, hidden: post.isDeleted },
    { key: "share", label: "Share", icon: Share2, onPress: share, hidden: post.isDeleted || post.isRemoved },
    {
      key: "copy",
      label: "Copy link",
      icon: Link2,
      onPress: () => copyLink(post.shareUrl).then(() => addToast("Link copied", "success")),
    },
    {
      key: "edit", label: "Edit post", icon: Pencil, onPress: () => onEdit?.(),
      hidden: !post.isMine || !onEdit || post.kind === "link" || post.isDeleted || post.isRemoved,
    },
    {
      key: "hide",
      label: "Hide",
      icon: EyeOff,
      hidden: post.isMine,
      onPress: member(() => run(async () => {
        await setPostHidden(token, post.id, true);
        gone("Post hidden");
      }, "Couldn't hide the post")),
    },
    { key: "report", label: "Report", icon: Flag, hidden: post.isMine || post.isDeleted, onPress: member(() => setReportOpen(true)) },
    {
      key: "block",
      label: authorHandle ? `Block u/${authorHandle}` : "Block this author",
      icon: UserX,
      hidden: post.isMine || post.isDeleted,
      destructive: true,
      onPress: member(async () => {
        const ok = await confirm(
          "Block this author?",
          post.isAnonymous
            ? "You won't see their anonymous posts and comments. You won't be told who they are."
            : "You won't see their posts and comments. They aren't notified.",
          { confirmLabel: "Block", destructive: true },
        );
        if (ok) run(async () => {
          await blockPostAuthor(token, post.id);
          gone("Author blocked");
        }, "Couldn't block");
      }),
    },
    {
      key: "delete",
      label: "Delete post",
      icon: Trash2,
      destructive: true,
      hidden: !post.isMine || post.isDeleted,
      onPress: async () => {
        const ok = await confirm("Delete this post?", "Comments stay, but your post will show as deleted.", {
          confirmLabel: "Delete",
          destructive: true,
        });
        if (ok) run(async () => {
          await deletePost(token, post.id);
          gone("Post deleted");
        }, "Couldn't delete the post");
      },
    },
    // Moderator tools
    { key: "pin", label: post.isPinned ? "Unpin" : "Pin to community", icon: post.isPinned ? PinOff : Pin, hidden: !isMod || post.isDeleted, onPress: () => mod(post.isPinned ? "unpin" : "pin", post.isPinned ? "Unpinned" : "Pinned") },
    { key: "lock", label: post.isLocked ? "Unlock comments" : "Lock comments", icon: post.isLocked ? LockOpen : Lock, hidden: !isMod || post.isDeleted, onPress: () => mod(post.isLocked ? "unlock" : "lock", post.isLocked ? "Comments unlocked" : "Comments locked") },
    { key: "approve", label: "Approve (restore)", icon: CircleCheck, hidden: !isMod || !post.isRemoved, onPress: () => mod("approve", "Post restored") },
    {
      key: "remove",
      label: "Remove post",
      icon: ShieldX,
      destructive: true,
      hidden: !isMod || post.isRemoved || post.isDeleted,
      onPress: async () => {
        if (await confirm("Remove this post?", "It's hidden from everyone except its author and moderators.", { confirmLabel: "Remove", destructive: true })) {
          mod("remove", "Post removed", { reason: "" });
        }
      },
    },
    {
      key: "ban",
      label: "Ban author from community",
      icon: Ban,
      destructive: true,
      hidden: !isMod || post.isMine || post.isDeleted,
      onPress: async () => {
        if (await confirm("Ban this author for 7 days?", post.isAnonymous ? "The ban applies without revealing who they are." : undefined, { confirmLabel: "Ban", destructive: true })) {
          mod("ban-author", "Author banned for 7 days", { reason: "Rule violation", days: 7 });
        }
      },
    },
  ];

  const elements = (
    <>
      <ActionSheet visible={menuOpen} title={post.title} actions={actions} onClose={() => setMenuOpen(false)} />
      <ReportSheet
        visible={reportOpen}
        what="post"
        onClose={() => setReportOpen(false)}
        onSubmit={async (reason, details) => {
          try {
            const result = await reportContent(token, "post", post.id, reason, details);
            addToast("Thanks — moderators will review it", "success");
            if (result?.autoHidden) patchPost(post.id, { gone: true });
          } catch (error) {
            handleError(error, "Couldn't send the report");
            throw error;
          }
        }}
      />
    </>
  );

  return { openMenu: () => setMenuOpen(true), share, toggleSave, elements };
}
