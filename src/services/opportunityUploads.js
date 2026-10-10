import { presignUpload } from "@/services/opportunities";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

export const MAX_LOGO_BYTES = 500_000;
export const MAX_DOCUMENT_BYTES = 10_000_000; // generous for a JD PDF or resume

const LOGO_STEPS = [
  { edge: 512, quality: 0.85 },
  { edge: 512, quality: 0.65 },
  { edge: 384, quality: 0.6 },
];

/** Opens the photo library for a company logo (single image). */
export async function pickLogo() {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1, exif: false });
  return result.canceled ? null : result.assets[0];
}

/** Re-encodes a logo as JPEG under MAX_LOGO_BYTES — same step-down approach as forumImages.js. */
export async function compressLogo(asset) {
  for (const { edge, quality } of LOGO_STEPS) {
    const ctx = ImageManipulator.manipulate(asset.uri);
    if (Math.max(asset.width, asset.height) > edge) {
      ctx.resize(asset.width >= asset.height ? { width: edge, height: null } : { width: null, height: edge });
    }
    const rendered = await ctx.renderAsync();
    const saved = await rendered.saveAsync({ compress: quality, format: SaveFormat.JPEG });
    const rawBlob = await (await fetch(saved.uri)).blob();
    // fetch(file://).blob() leaves blob.type empty on Android/iOS, and RN's
    // networking layer reads the real Content-Type from blob.type — not from
    // the headers passed to fetch() — so an untyped blob silently uploads
    // with an empty Content-Type and breaks the presigned URL's signature.
    const blob = rawBlob.slice(0, rawBlob.size, "image/jpeg");
    if (blob.size <= MAX_LOGO_BYTES) {
      return { uri: saved.uri, blob, bytes: blob.size, contentType: "image/jpeg" };
    }
  }
  throw new Error("This logo is too large even after compressing — try another image.");
}

/** Picks a PDF (resume or attachment) — size-capped, not recompressed. */
export async function pickDocument() {
  const result = await DocumentPicker.getDocumentAsync({ type: ["application/pdf"], copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (asset.size > MAX_DOCUMENT_BYTES) {
    throw new Error("That file is too large — please keep it under 10 MB.");
  }
  const rawBlob = await (await fetch(asset.uri)).blob();
  const blob = rawBlob.slice(0, rawBlob.size, "application/pdf"); // same blob.type fix as above
  return { uri: asset.uri, name: asset.name, blob, bytes: blob.size, contentType: "application/pdf" };
}

/**
 * Presigns and PUTs a file for any of the three opportunity upload purposes.
 * `purpose`: "opportunity-logo" | "opportunity-attachment" | "resume".
 */
export async function uploadFile(token, purpose, file) {
  const { key, url, uploadUrl } = await presignUpload(token, purpose, file.contentType);
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.contentType },
    body: file.blob,
  });
  if (!response.ok) throw new Error(`Upload failed (${response.status})`);
  return { key, url, bytes: file.bytes, name: file.name };
}
