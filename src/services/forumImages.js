import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { requestImageUpload } from "@/services/forum";

// The server accepts ≤ 512,000 bytes; aim a little under.
export const MAX_IMAGE_BYTES = 500_000;
export const MAX_IMAGES = 4;

// Tried in order until the JPEG fits: quality first, then size. Most phone
// photos (3-5 MB) land on the first or second step.
const STEPS = [
  { edge: 1600, quality: 0.8 },
  { edge: 1600, quality: 0.65 },
  { edge: 1600, quality: 0.5 },
  { edge: 1280, quality: 0.6 },
  { edge: 1024, quality: 0.55 },
  { edge: 800, quality: 0.5 },
];

/** Opens the photo library (photos only — no video). Returns picker assets. */
export async function pickImages(remaining) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: remaining > 1,
    selectionLimit: remaining,
    quality: 1,
    exif: false,
  });
  return result.canceled ? [] : result.assets;
}

/**
 * Re-encodes a photo as JPEG under MAX_IMAGE_BYTES. Re-encoding writes a new
 * file without the original's metadata, so camera EXIF (including GPS
 * location) is not uploaded — important for anonymous posts.
 */
export async function compressImage(asset) {
  for (const { edge, quality } of STEPS) {
    const ctx = ImageManipulator.manipulate(asset.uri);
    if (Math.max(asset.width, asset.height) > edge) {
      ctx.resize(asset.width >= asset.height ? { width: edge, height: null } : { width: null, height: edge });
    }
    const rendered = await ctx.renderAsync();
    const saved = await rendered.saveAsync({ compress: quality, format: SaveFormat.JPEG });
    const rawBlob = await (await fetch(saved.uri)).blob();
    // fetch(file://).blob() leaves blob.type empty on Android/iOS. RN's
    // networking layer sets the real Content-Type from blob.type — not from
    // the headers we pass to fetch() — so an untyped blob silently uploads
    // with an empty Content-Type, breaking the presigned URL's signature.
    const blob = rawBlob.slice(0, rawBlob.size, "image/jpeg");
    if (blob.size <= MAX_IMAGE_BYTES) {
      return { uri: saved.uri, width: saved.width, height: saved.height, blob, bytes: blob.size };
    }
  }
  throw new Error("This photo is too large even after compressing — try another one.");
}

/** Presigns and PUTs one compressed image. Returns the key (for a gallery post) and its public url (for inline embedding). */
export async function uploadImage(token, image) {
  const { key, url, uploadUrl } = await requestImageUpload(token, "image/jpeg", image.bytes);
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "image/jpeg" },
    body: image.blob,
  });
  if (!response.ok) {
    throw new Error(`Image upload failed (${response.status})`);
  }
  return { key, url, width: image.width, height: image.height };
}
