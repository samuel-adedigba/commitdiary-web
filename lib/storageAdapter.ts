/**
 * Object-storage adapter — provider-neutral profile media boundary.
 * Keeps media metadata in PostgreSQL and binary objects in object storage
 * (Supabase Storage today, S3-compatible tomorrow).
 *
 * Store stable asset IDs, owner, purpose, content type, size, checksum,
 * and provider-neutral object keys. Do not persist public Supabase URLs
 * as the only reference. Access is authorized by the API with short-lived
 * URLs or streamed responses (future).
 */

export type StorageProvider = "supabase" | "s3";

export type PutProfileMediaParams = {
  userId: string;
  kind: "avatar" | "cover";
  buffer: Buffer;
  contentType: string; // image/jpeg | image/png | image/webp
  accessToken: string; // for auth to storage provider
};

export type PutProfileMediaResult = {
  path: string; // provider-neutral object key, e.g. "<userId>/avatar-<uuid>.jpg"
  publicUrl: string; // currently public Supabase URL; future signed URL
};

import { authProvider } from "./authProvider";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function putProfileMedia(params: PutProfileMediaParams): Promise<PutProfileMediaResult> {
  const ext = ALLOWED_TYPES[params.contentType];
  if (!ext) throw new Error("Unsupported content type");

  // Stable asset ID + provider-neutral key (do not use timestamp-dependent naming elsewhere)
  const { randomUUID } = await import("crypto");
  const path = `${params.userId}/${params.kind}-${randomUUID()}.${ext}`;

  const res = await authProvider.uploadProfileMedia(params.accessToken, path, params.buffer, params.contentType);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Storage upload failed (${res.status}): ${body.slice(0, 300)}`);
  }

  return { path, publicUrl: authProvider.publicUrlForProfileMedia(path) };
}

export function getPublicUrl(path: string) {
  return authProvider.publicUrlForProfileMedia(path);
}

export function getStorageProvider(): StorageProvider {
  // Allow override via STORAGE_PROVIDER env; default supabase for now
  const p = (process.env.STORAGE_PROVIDER || "supabase").toLowerCase();
  return p === "s3" ? "s3" : "supabase";
}
