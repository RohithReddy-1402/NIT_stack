import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Paths } from "expo-file-system";
import { StorageAccessFramework } from "expo-file-system/legacy";
import { Platform } from "react-native";

const LIBRARY_KEY = "libraryDownloads";
const SAF_DIR_KEY = "safDownloadsDir";

async function readLibrary() {
  try {
    const raw = await AsyncStorage.getItem(LIBRARY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeLibrary(items) {
  await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(items));
}

function safeFileName(id, title) {
  const base = `${id}-${title || "paper"}`.replace(/[^a-zA-Z0-9-_]/g, "_");
  return `${base}.pdf`;
}

export async function getLibrary() {
  const items = await readLibrary();
  return [...items].sort(
    (a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt),
  );
}

export async function isInLibrary(id) {
  const items = await readLibrary();
  return items.some((item) => item.id === id);
}

export async function saveToLibrary({
  id,
  title,
  subject,
  code,
  year,
  source,
  remoteUrl,
}) {
  const items = await readLibrary();
  const existing = items.find((item) => item.id === id);
  if (existing) return existing;

  const destination = new File(Paths.document, safeFileName(id, title));
  const downloaded = await File.downloadFileAsync(remoteUrl, destination);

  const entry = {
    id,
    title: title || "Untitled",
    subject: subject || null,
    code: code || null,
    year: year || null,
    source,
    uri: downloaded.uri,
    downloadedAt: new Date().toISOString(),
  };

  const next = [...items, entry];
  await writeLibrary(next);
  return entry;
}

export async function saveGeneratedFileToLibrary({
  id,
  title,
  subject,
  code,
  year,
  source,
  localUri,
}) {
  const items = await readLibrary();
  const existing = items.find((item) => item.id === id);
  if (existing) return existing;

  const destination = new File(Paths.document, safeFileName(id, title));
  new File(localUri).copy(destination);

  const entry = {
    id,
    title: title || "Untitled",
    subject: subject || null,
    code: code || null,
    year: year || null,
    source,
    uri: destination.uri,
    downloadedAt: new Date().toISOString(),
  };

  const next = [...items, entry];
  await writeLibrary(next);
  return entry;
}

async function getSafDirectoryUri() {
  const stored = await AsyncStorage.getItem(SAF_DIR_KEY);
  if (stored) return stored;

  const permission = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permission.granted) return null;

  await AsyncStorage.setItem(SAF_DIR_KEY, permission.directoryUri);
  return permission.directoryUri;
}

async function writeFileToSaf(file, filename, mimeType) {
  const dirUri = await getSafDirectoryUri();
  if (!dirUri) return { savedDirectly: false };

  const base64 = await file.base64();
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  const safUri = await StorageAccessFramework.createFileAsync(
    dirUri,
    nameWithoutExt,
    mimeType,
  );
  await StorageAccessFramework.writeAsStringAsync(safUri, base64, {
    encoding: "base64",
  });

  return { savedDirectly: true, uri: safUri };
}

// Saves a file directly into a user-chosen public folder (e.g. Downloads) on
// Android via the Storage Access Framework, with no share sheet involved.
// Not supported on iOS — the OS sandbox has no public folder to write into,
// so callers should fall back to Sharing.shareAsync there.
export async function saveToDeviceStorage(remoteUrl, filename, mimeType = "application/pdf") {
  if (Platform.OS !== "android") {
    return { savedDirectly: false };
  }

  const tempFile = new File(Paths.cache, `tmp-${Date.now()}-${filename}`);
  try {
    const downloaded = await File.downloadFileAsync(remoteUrl, tempFile);
    return await writeFileToSaf(downloaded, filename, mimeType);
  } finally {
    try {
      if (tempFile.exists) tempFile.delete();
    } catch {
      // best-effort cleanup
    }
  }
}

// Same as saveToDeviceStorage, but for a file that already exists locally
// (e.g. a PDF just generated with expo-print) instead of one behind a URL.
export async function saveGeneratedFileToDevice(localUri, filename, mimeType = "application/pdf") {
  if (Platform.OS !== "android") {
    return { savedDirectly: false };
  }

  return await writeFileToSaf(new File(localUri), filename, mimeType);
}

export async function removeFromLibrary(id) {
  const items = await readLibrary();
  const target = items.find((item) => item.id === id);

  if (target?.uri) {
    try {
      const file = new File(target.uri);
      if (file.exists) file.delete();
    } catch {
      // file may already be gone — ignore
    }
  }

  const next = items.filter((item) => item.id !== id);
  await writeLibrary(next);
}
