const { withAndroidManifest } = require("@expo/config-plugins");

// SYSTEM_ALERT_WINDOW (leaks in from react-native's own debug-tools manifest)
// and RECORD_AUDIO (leaks in via react-native-webview's getUserMedia support)
// end up in the generated manifest for every variant even though this app
// never uses either. Both are permissions mobile AV heuristics weight heavily
// (overlay/tapjacking, microphone/spyware), so strip them at the source.
const UNUSED_PERMISSIONS = new Set([
  "android.permission.SYSTEM_ALERT_WINDOW",
  "android.permission.RECORD_AUDIO",
]);

module.exports = function withoutUnusedPermissions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (!Array.isArray(manifest["uses-permission"])) {
      manifest["uses-permission"] = [];
    }

    // Some of these are re-added by Gradle's manifest merger at actual build
    // time from a library's own AndroidManifest.xml (e.g. react-native-webview
    // for RECORD_AUDIO), after this prebuild step already ran. Filtering the
    // array here isn't enough for those — an explicit tools:node="remove"
    // entry is what Gradle's merger itself honors.
    manifest["uses-permission"] = manifest["uses-permission"].filter(
      (entry) => !UNUSED_PERMISSIONS.has(entry.$["android:name"]),
    );

    for (const name of UNUSED_PERMISSIONS) {
      manifest["uses-permission"].push({
        $: { "android:name": name, "tools:node": "remove" },
      });
    }

    if (!manifest.$["xmlns:tools"]) {
      manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    return config;
  });
};
