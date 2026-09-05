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

  const provider = getStorageProvider();
  // Stable asset ID + provider-neutral key (do not use timestamp-dependent naming elsewhere)
  const { randomUUID } = await import("crypto");
  const path = `${params.userId}/${params.kind}-${randomUUID()}.${ext}`;

  if (provider === "s3") {
    // S3-compatible provider (AWS S3, MinIO, Supabase S3-compatible, etc.)
    const bucket = process.env.S3_BUCKET || process.env.NEXT_PUBLIC_S3_BUCKET;
    const region = process.env.S3_REGION || process.env.AWS_REGION || "us-east-1";
    const endpoint = process.env.S3_ENDPOINT || process.env.NEXT_PUBLIC_S3_ENDPOINT;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
    const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;

    if (!bucket) throw new Error("S3_BUCKET not configured for STORAGE_PROVIDER=s3");
    // Use AWS SDK v3 when credentials/bucket are present; fallback to error if not configured
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const s3 = new S3Client({
      region,
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
      ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
    });
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: path,
        Body: params.buffer,
        ContentType: params.contentType,
        CacheControl: "public, max-age=3600",
      }),
    );
    const publicUrl = publicBaseUrl ? `${publicBaseUrl.replace(/\/$/, "")}/${path}` : `https://${bucket}.s3.${region}.amazonaws.com/${path}`;
    return { path, publicUrl };
  }

  // Default: Supabase Storage via authProvider (current production)
  const res = await authProvider.uploadProfileMedia(params.accessToken, path, params.buffer, params.contentType);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Storage upload failed (${res.status}): ${body.slice(0, 300)}`);
  }

  return { path, publicUrl: authProvider.publicUrlForProfileMedia(path) };
}

export async function deleteProfileMedia(path: string, accessToken: string): Promise<void> {
  const provider = getStorageProvider();
  if (provider === "s3") {
    const bucket = process.env.S3_BUCKET || process.env.NEXT_PUBLIC_S3_BUCKET;
    const region = process.env.S3_REGION || process.env.AWS_REGION || "us-east-1";
    const endpoint = process.env.S3_ENDPOINT || process.env.NEXT_PUBLIC_S3_ENDPOINT;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
    if (!bucket) throw new Error("S3_BUCKET not configured for STORAGE_PROVIDER=s3");
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const s3 = new S3Client({
      region,
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
      ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
    });
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: path }));
    return;
  }

  const response = await authProvider.deleteProfileMedia(accessToken, path);
  if (!response.ok && response.status !== 404) {
    throw new Error(`Storage cleanup failed (${response.status})`);
  }
}

export function getPublicUrl(path: string) {
  const provider = getStorageProvider();
  if (provider === "s3") {
    const bucket = process.env.S3_BUCKET || process.env.NEXT_PUBLIC_S3_BUCKET;
    const region = process.env.S3_REGION || process.env.AWS_REGION || "us-east-1";
    const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL;
    if (publicBaseUrl) return `${publicBaseUrl.replace(/\/$/, "")}/${path}`;
    if (bucket) return `https://${bucket}.s3.${region}.amazonaws.com/${path}`;
  }
  return authProvider.publicUrlForProfileMedia(path);
}

export function getStorageProvider(): StorageProvider {
  // Allow override via STORAGE_PROVIDER env; default supabase for now
  const p = (process.env.STORAGE_PROVIDER || "supabase").toLowerCase();
  return p === "s3" ? "s3" : "supabase";
}
