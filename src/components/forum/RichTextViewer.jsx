import { useTheme } from "@/contexts/ThemeContext";
import * as WebBrowser from "expo-web-browser";
import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import RenderHTML, { HTMLContentModel, HTMLElementModel } from "react-native-render-html";
import MathText from "./MathText";

// A made-up tag `wrapMath` below stands in for LaTeX: users type raw
// `$...$`/`$$...$$` in the editor (plain text, no editor change needed), and
// only at display time do we swap those spans for a rendered formula. This
// keeps LaTeX out of the stored/sanitized HTML entirely.
const mathElementModels = {
  mathspan: HTMLElementModel.fromCustomModel({
    tagName: "mathspan",
    contentModel: HTMLContentModel.textual,
    isOpaque: true,
  }),
};

const mathRenderers = {
  mathspan: ({ tnode }) => (
    <MathText tex={decodeURIComponent(tnode.attributes["data-tex"] || "")} display={tnode.attributes["data-display"] === "1"} />
  ),
};

/** Replaces `$$...$$` / `$...$` in the raw HTML with a <mathspan> MathText can render. */
const wrapMath = (html) => {
  if (!html || !html.includes("$")) return html;
  return html
    .replace(/\$\$([^$]+)\$\$/g, (_, tex) => `<mathspan data-tex="${encodeURIComponent(tex.trim())}" data-display="1"></mathspan>`)
    .replace(/\$([^$\n]+)\$/g, (_, tex) => `<mathspan data-tex="${encodeURIComponent(tex.trim())}" data-display="0"></mathspan>`);
};

// Renders the sanitized HTML a rich (blog-style) post's body holds — see
// back/services/forum/validate.js#sanitizeForumHtml for what tags/attributes
// can actually reach here. Sibling to Markdown.jsx, which renders the older
// plain-markdown posts; PostCard/the post detail screen pick between the two
// based on `post.bodyFormat`.
function RichTextViewer({ html, width }) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = width ?? screenWidth - 32;
  const mathHtml = useMemo(() => wrapMath(html), [html]);

  const tagsStyles = useMemo(
    () => ({
      body: { color: colors.silver, fontSize: 15, lineHeight: 22 },
      p: { marginTop: 0, marginBottom: 10 },
      h1: { color: colors.chrome, fontSize: 21, fontWeight: "800", marginTop: 14, marginBottom: 8 },
      h2: { color: colors.chrome, fontSize: 18.5, fontWeight: "800", marginTop: 12, marginBottom: 7 },
      h3: { color: colors.chrome, fontSize: 16.5, fontWeight: "700", marginTop: 10, marginBottom: 6 },
      strong: { color: colors.chrome, fontWeight: "700" },
      a: { color: colors.accent, textDecorationLine: "underline" },
      blockquote: {
        marginLeft: 0,
        paddingLeft: 12,
        borderLeftWidth: 3,
        borderLeftColor: colors.hairline,
        color: colors.steel,
      },
      ul: { marginTop: 0, marginBottom: 10 },
      ol: { marginTop: 0, marginBottom: 10 },
      li: { marginBottom: 4 },
      img: { borderRadius: 12, marginVertical: 8 },
      code: {
        fontFamily: "monospace",
        backgroundColor: colors.onyxRaised,
        borderRadius: 4,
        paddingHorizontal: 4,
      },
      pre: {
        fontFamily: "monospace",
        backgroundColor: colors.onyxRaised,
        borderRadius: 10,
        padding: 12,
        marginVertical: 8,
      },
    }),
    [colors],
  );

  return (
    <RenderHTML
      source={{ html: mathHtml || "" }}
      contentWidth={contentWidth}
      tagsStyles={tagsStyles}
      enableExperimentalMarginCollapsing
      customHTMLElementModels={mathElementModels}
      renderers={mathRenderers}
      renderersProps={{
        a: {
          onPress: (_event, url) => {
            if (/^https?:\/\//i.test(url)) WebBrowser.openBrowserAsync(url).catch(() => {});
          },
        },
        img: { enableExperimentalPercentWidth: true },
      }}
    />
  );
}

export default RichTextViewer;
