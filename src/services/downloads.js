import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Paths } from "expo-file-system";

const LIBRARY_KEY = "libraryDownloads";

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
