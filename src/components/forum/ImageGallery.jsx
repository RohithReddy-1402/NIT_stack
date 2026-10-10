import { useTheme } from "@/contexts/ThemeContext";
import { Image } from "expo-image";
import { X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const clampRatio = (img) => Math.min(Math.max(img.width / img.height, 0.6), 2);

/**
 * `preview`: first image only with a "+N" badge (feed cards).
 * Otherwise a swipeable pager with dots (post screen). Tap → full-screen viewer.
 */
export default function ImageGallery({ images, preview = false, width }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [viewer, setViewer] = useState(null); // index | null
  const [page, setPage] = useState(0);
  if (!images?.length) return null;

  // Tallest image decides the frame so the pager doesn't jump between pages.
  const ratio = Math.min(...images.map(clampRatio));
  const height = width / ratio;

  return (
    <View>
      {preview ? (
        <Pressable onPress={() => setViewer(0)} style={[styles.frame, { width, height }]}>
          <Image source={{ uri: images[0].url }} style={styles.fill} contentFit="cover" transition={150} recyclingKey={images[0].url} />
          {images.length > 1 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>+{images.length - 1}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : (
        <View>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(img) => img.url}
            onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item, index }) => (
              <Pressable onPress={() => setViewer(index)} style={[styles.frame, { width, height }]}>
                <Image source={{ uri: item.url }} style={styles.fill} contentFit="contain" transition={150} />
              </Pressable>
            )}
          />
          {images.length > 1 ? (
            <View style={styles.dots}>
              {images.map((img, i) => (
                <View key={img.url} style={[styles.dot, i === page && styles.dotActive]} />
              ))}
            </View>
          ) : null}
        </View>
      )}
      {/* Keyed so the page counter restarts at whichever image was tapped. */}
      <ImageViewer key={viewer ?? "closed"} images={images} index={viewer} onClose={() => setViewer(null)} />
    </View>
  );
}

function ImageViewer({ images, index, onClose }) {
  const { width, height } = useWindowDimensions();
  const [page, setPage] = useState(index ?? 0);
  return (
    <Modal visible={index !== null} animationType="fade" onRequestClose={onClose} transparent>
      <View style={viewerStyles.root}>
        <SafeAreaView style={viewerStyles.bar} edges={["top"]}>
          <Text style={viewerStyles.counter}>{images.length > 1 ? `${page + 1} / ${images.length}` : ""}</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
            <X size={26} color="#fff" />
          </Pressable>
        </SafeAreaView>
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          initialScrollIndex={index ?? 0}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(img) => img.url}
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <Image source={{ uri: item.url }} style={{ width, height }} contentFit="contain" />
          )}
        />
      </View>
    </Modal>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    frame: { borderRadius: 14, overflow: "hidden", backgroundColor: colors.onyx },
    fill: { width: "100%", height: "100%" },
    badge: {
      position: "absolute",
      right: 10,
      bottom: 10,
      backgroundColor: "rgba(0,0,0,0.65)",
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeText: { color: "#fff", fontWeight: "700", fontSize: 12.5 },
    dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 8 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.hairline },
    dotActive: { backgroundColor: colors.chrome },
  });

const viewerStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  bar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  counter: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
