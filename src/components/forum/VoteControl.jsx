import { useTheme } from "@/contexts/ThemeContext";
import { compactNumber } from "@/utils/forumFormat";
import { ArrowBigDown, ArrowBigUp } from "lucide-react-native";
import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const UP = "#FF6A2B";
const DOWN = "#8E8EFF";

/** Pill with up/down arrows. Tapping the active arrow clears the vote. */
function VoteControl({ score, myVote, onVote, disabled = false, compact = false }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors, compact), [colors, compact]);
  const tint = myVote === 1 ? UP : myVote === -1 ? DOWN : colors.silver;
  const size = compact ? 18 : 20;

  return (
    <View style={[styles.pill, myVote !== 0 && { borderColor: tint }]}>
      <Pressable
        onPress={() => onVote(myVote === 1 ? 0 : 1)}
        disabled={disabled}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={myVote === 1 ? "Remove upvote" : "Upvote"}
        style={styles.btn}
      >
        <ArrowBigUp size={size} color={myVote === 1 ? UP : colors.steel} fill={myVote === 1 ? UP : "transparent"} strokeWidth={1.6} />
      </Pressable>
      <Text style={[styles.score, { color: tint }]} accessibilityLabel={`${score} points`}>
        {compactNumber(score)}
      </Text>
      <Pressable
        onPress={() => onVote(myVote === -1 ? 0 : -1)}
        disabled={disabled}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={myVote === -1 ? "Remove downvote" : "Downvote"}
        style={styles.btn}
      >
        <ArrowBigDown size={size} color={myVote === -1 ? DOWN : colors.steel} fill={myVote === -1 ? DOWN : "transparent"} strokeWidth={1.6} />
      </Pressable>
    </View>
  );
}

export default memo(VoteControl);

const getStyles = (colors, compact) =>
  StyleSheet.create({
    pill: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
      paddingHorizontal: 4,
      height: compact ? 30 : 34,
    },
    btn: { paddingHorizontal: 4, paddingVertical: 4 },
    score: { fontSize: 13, fontWeight: "700", minWidth: 22, textAlign: "center" },
  });
