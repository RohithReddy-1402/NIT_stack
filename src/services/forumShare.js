import * as Clipboard from "expo-clipboard";
import { Platform, Share } from "react-native";

// expo-sharing only shares files, so links go through the OS share sheet.
// Returns "shared" | "copied" | "dismissed".
export async function shareLink(title, url) {
  if (Platform.OS === "web") {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return "shared";
      } catch {
        return "dismissed";
      }
    }
    await Clipboard.setStringAsync(url);
    return "copied";
  }
  // iOS shows `url` as a rich link next to the message; Android only has `message`.
  const result = await Share.share(
    Platform.OS === "ios" ? { message: title, url } : { message: `${title}\n${url}`, title },
  );
  return result.action === Share.dismissedAction ? "dismissed" : "shared";
}

export async function copyLink(url) {
  await Clipboard.setStringAsync(url);
}
