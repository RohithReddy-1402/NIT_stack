import { useCallback, useState } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";
import { useTheme } from "@/contexts/ThemeContext";

// KaTeX ships no RN binding, so a single formula gets its own tiny WebView
// loading KaTeX from a CDN — fine for the handful of formulas a post
// typically has. See RichTextViewer.jsx for how `$...$`/`$$...$$` become
// this component.
const KATEX_CDN = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.11";

function MathText({ tex, display }) {
  const { colors } = useTheme();
  const [height, setHeight] = useState(display ? 40 : 24);

  const html = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${KATEX_CDN}/katex.min.css">
<style>
  html, body { margin: 0; padding: 0; background: transparent; color: ${colors.silver}; }
  #m { font-size: ${display ? 17 : 15}px; overflow-x: auto; }
</style>
</head>
<body>
<div id="m"></div>
<script src="${KATEX_CDN}/katex.min.js"></script>
<script>
  try {
    katex.render(${JSON.stringify(tex || "")}, document.getElementById("m"), {
      throwOnError: false,
      displayMode: ${display ? "true" : "false"},
    });
  } catch (e) {}
  function post() {
    window.ReactNativeWebView.postMessage(String(document.getElementById("m").offsetHeight));
  }
  window.onload = post;
  setTimeout(post, 80);
</script>
</body>
</html>`;

  const onMessage = useCallback((event) => {
    const h = Number(event.nativeEvent.data);
    if (Number.isFinite(h) && h > 0) setHeight(h + 4);
  }, []);

  return (
    <View style={{ height, width: "100%" }}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        onMessage={onMessage}
        scrollEnabled={false}
        style={{ backgroundColor: "transparent" }}
        containerStyle={{ backgroundColor: "transparent" }}
      />
    </View>
  );
}

export default MathText;
