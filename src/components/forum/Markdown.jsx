import { useTheme } from "@/contexts/ThemeContext";
import * as WebBrowser from "expo-web-browser";
import { memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

// A deliberately small, safe Markdown subset for posts and comments:
// **bold**, *italic*, `code`, ```code blocks```, > quotes, - / 1. lists,
// # headings, [links](https://…) and bare https:// URLs. Output is plain
// React Native Text/View — never HTML — and only http(s) links are opened.
// The web app renders the same subset.

const INLINE = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`|\[[^\]\n]+\]\(https?:\/\/[^)\s]+\)|https?:\/\/[^\s<>()]+)/g;

const openLink = (url) => {
  if (/^https?:\/\//i.test(url)) WebBrowser.openBrowserAsync(url).catch(() => {});
};

function Inline({ text, styles }) {
  const parts = text.split(INLINE);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <Text key={i} style={styles.bold}>{part.slice(2, -2)}</Text>;
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      if (part.length > 2) return <Text key={i} style={styles.italic}>{part.slice(1, -1)}</Text>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return <Text key={i} style={styles.code}>{part.slice(1, -1)}</Text>;
    }
    const link = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(part);
    if (link) {
      return <Text key={i} style={styles.link} onPress={() => openLink(link[2])}>{link[1]}</Text>;
    }
    if (/^https?:\/\//.test(part)) {
      // Trailing punctuation belongs to the sentence, not the URL.
      const [, url, tail] = /^(.*?)([.,!?;:]*)$/.exec(part);
      return (
        <Text key={i}>
          <Text style={styles.link} onPress={() => openLink(url)}>{url}</Text>
          {tail}
        </Text>
      );
    }
    return part;
  });
}

/** Splits source into blocks: code fences, quotes, lists, headings, paragraphs. */
function parseBlocks(source) {
  const lines = String(source || "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const body = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i])) body.push(lines[i++]);
      i += 1;
      blocks.push({ type: "code", text: body.join("\n") });
    } else if (/^>\s?/.test(line)) {
      const body = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) body.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push({ type: "quote", text: body.join("\n") });
    } else if (/^\s*([-*•]|\d+[.)])\s+/.test(line)) {
      const items = [];
      const ordered = /^\s*\d+[.)]/.test(line);
      while (i < lines.length && /^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) {
        items.push(lines[i++].replace(/^\s*([-*•]|\d+[.)])\s+/, ""));
      }
      blocks.push({ type: "list", ordered, items });
    } else if (/^#{1,3}\s+/.test(line)) {
      blocks.push({ type: "heading", text: line.replace(/^#{1,3}\s+/, "") });
      i += 1;
    } else if (!line.trim()) {
      i += 1;
    } else {
      const body = [];
      while (
        i < lines.length && lines[i].trim() &&
        !/^(```|>|#{1,3}\s)/.test(lines[i]) && !/^\s*([-*•]|\d+[.)])\s+/.test(lines[i])
      ) {
        body.push(lines[i++]);
      }
      blocks.push({ type: "p", text: body.join("\n") });
    }
  }
  return blocks;
}

function Markdown({ children, numberOfLines, size = 15 }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors, size), [colors, size]);
  const blocks = useMemo(() => parseBlocks(children), [children]);

  // Previews (feed cards) flatten to one clamped Text so ellipsis works.
  if (numberOfLines) {
    const flat = blocks
      .map((b) => (b.type === "list" ? b.items.map((it) => `• ${it}`).join("\n") : b.text))
      .join("\n")
      .replace(/```|\*\*|`/g, "");
    return (
      <Text style={styles.p} numberOfLines={numberOfLines}>
        {flat}
      </Text>
    );
  }

  return (
    <View style={styles.root}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "code":
            return (
              <View key={i} style={styles.codeBlock}>
                <Text style={styles.codeBlockText} selectable>{b.text}</Text>
              </View>
            );
          case "quote":
            return (
              <View key={i} style={styles.quote}>
                <Text style={[styles.p, styles.quoteText]} selectable><Inline text={b.text} styles={styles} /></Text>
              </View>
            );
          case "list":
            return (
              <View key={i} style={styles.list}>
                {b.items.map((item, j) => (
                  <View key={j} style={styles.listRow}>
                    <Text style={styles.bullet}>{b.ordered ? `${j + 1}.` : "•"}</Text>
                    <Text style={[styles.p, styles.listText]} selectable><Inline text={item} styles={styles} /></Text>
                  </View>
                ))}
              </View>
            );
          case "heading":
            return (
              <Text key={i} style={styles.heading} selectable><Inline text={b.text} styles={styles} /></Text>
            );
          default:
            return (
              <Text key={i} style={styles.p} selectable><Inline text={b.text} styles={styles} /></Text>
            );
        }
      })}
    </View>
  );
}

export default memo(Markdown);

const getStyles = (colors, size) =>
  StyleSheet.create({
    root: { gap: 10 },
    p: { color: colors.silver, fontSize: size, lineHeight: Math.round(size * 1.45) },
    bold: { fontWeight: "700", color: colors.chrome },
    italic: { fontStyle: "italic" },
    code: {
      fontFamily: "monospace",
      fontSize: size - 1.5,
      backgroundColor: colors.glassFillRaised,
      color: colors.chrome,
    },
    link: { color: colors.accent, textDecorationLine: "underline" },
    heading: { color: colors.chrome, fontSize: size + 2, fontWeight: "700" },
    codeBlock: {
      backgroundColor: colors.glassFillRaised,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: 10,
    },
    codeBlockText: { fontFamily: "monospace", fontSize: size - 2, color: colors.chrome },
    quote: { borderLeftWidth: 3, borderLeftColor: colors.hairline, paddingLeft: 10 },
    quoteText: { color: colors.steel },
    list: { gap: 4 },
    listRow: { flexDirection: "row", gap: 8 },
    bullet: { color: colors.steel, fontSize: size, lineHeight: Math.round(size * 1.45), minWidth: 14 },
    listText: { flex: 1 },
  });
