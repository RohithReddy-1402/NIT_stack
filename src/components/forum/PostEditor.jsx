import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { MAX_IMAGES, compressImage, pickImages, uploadImage } from "@/services/forumImages";
import { RichText, Toolbar } from "@10play/tentap-editor";
import { ImagePlus } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export { useEditorBridge, TenTapStartKit, darkEditorTheme, defaultEditorTheme } from "@10play/tentap-editor";

/**
 * The blog-style rich post editor: TenTap's WebView-hosted TipTap editor +
 * its built-in formatting toolbar (bold/italic/strike/headings/lists/quote/
 * link), plus our own image button — TenTap's toolbar has no image action of
 * its own, and inserting one needs our existing pick → compress → upload
 * pipeline (`forumImages.js`), not a bare URL prompt.
 *
 * `editor` is the bridge from `useEditorBridge()`, created by the caller so
 * it can also read `editor.getHTML()` when the post is submitted.
 */
export default function PostEditor({ editor, editable = true, allowImages = true, minHeight = 180 }) {
  const { token } = useAuth();
  const { colors } = useTheme();
  const { addToast } = useToast();
  const styles = useMemo(() => getStyles(colors, minHeight), [colors, minHeight]);
  const [uploading, setUploading] = useState(false);

  const insertImage = async () => {
    if (uploading) return;
    let assets;
    try {
      assets = await pickImages(1);
    } catch {
      addToast("Couldn't open your photos", "error");
      return;
    }
    const asset = assets[0];
    if (!asset) return;

    setUploading(true);
    try {
      const compressed = await compressImage(asset);
      const uploaded = await uploadImage(token, compressed);
      editor.setImage(uploaded.url);
    } catch (error) {
      addToast(error?.message || "Couldn't add that photo", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <RichText editor={editor} style={styles.richText} />
      {allowImages && (
        <View style={styles.toolbarRow}>
          <TouchableOpacity
            style={styles.imageBtn}
            onPress={insertImage}
            disabled={!editable || uploading}
            accessibilityLabel="Insert image"
          >
            {uploading ? (
              <ActivityIndicator size="small" color={colors.chrome} />
            ) : (
              <ImagePlus size={19} color={colors.chrome} strokeWidth={1.9} />
            )}
          </TouchableOpacity>
          <Text style={styles.imageBtnHint}>Up to {MAX_IMAGES} photos, added one at a time</Text>
        </View>
      )}
      <Toolbar editor={editor} />
    </View>
  );
}

const getStyles = (colors, minHeight) =>
  StyleSheet.create({
    wrap: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
      overflow: "hidden",
    },
    richText: { minHeight, backgroundColor: "transparent" },
    toolbarRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
    },
    imageBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.glassFillRaised,
    },
    imageBtnHint: { color: colors.steel, fontSize: 11.5, flex: 1 },
  });
