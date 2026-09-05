import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  enforceAuthRateLimit,
  fetchAuthProvider,
  publicUserMetadata,
} from "../_utils";
import { deleteProfileMedia, putProfileMedia } from "../../../../lib/storageAdapter";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_MULTIPART_BYTES = MAX_FILE_BYTES + 64 * 1024;
const MEDIA_TYPES = { avatar: "avatar_url", cover: "cover_url" };
const EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

async function getAuthenticatedUser(request) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const response = await fetchAuthProvider(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const user = await response.json().catch(() => null);
  if (!user || typeof user.id !== "string") return null;
  return { token, user };
}

export async function PUT(request) {
  const session = await getAuthenticatedUser(request);
  if (!session) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const fullName = typeof body.full_name === "string" ? body.full_name.trim().slice(0, 120) : "";
  const response = await fetchAuthProvider(`${SUPABASE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ data: { ...(session.user.user_metadata || {}), full_name: fullName } }),
  });
  if (!response.ok) return NextResponse.json({ error: "We could not save your profile." }, { status: 502 });
  const user = await response.json();
  return NextResponse.json({ user: { id: user.id, email: user.email, user_metadata: publicUserMetadata(user.user_metadata) } });
}

export async function POST(request) {
  const rateLimitResponse = await enforceAuthRateLimit(request, "profile-upload", 20, 60 * 60 * 1000);
  if (rateLimitResponse) return rateLimitResponse;
  const contentLength = Number(request.headers.get("content-length"));
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0) {
    return NextResponse.json({ error: "A valid Content-Length header is required." }, { status: 411 });
  }
  if (contentLength > MAX_MULTIPART_BYTES) {
    return NextResponse.json({ error: "Use a JPG, PNG, or WebP image up to 5 MB." }, { status: 413 });
  }
  const session = await getAuthenticatedUser(request);
  if (!session) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Choose a valid profile image." }, { status: 400 });
  const kind = formData.get("kind");
  const file = formData.get("file");
  if (!Object.hasOwn(MEDIA_TYPES, kind) || !file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "Choose a valid profile image." }, { status: 400 });
  }
  if (!Number.isSafeInteger(file.size) || file.size <= 0 || file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Use a JPG, PNG, or WebP image up to 5 MB." }, { status: 400 });
  }
  let buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "Choose a valid profile image." }, { status: 400 });
  }
  const validSignature = file.type === "image/jpeg"
    ? buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
    : file.type === "image/png"
      ? buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      : buffer.subarray(0, 4).toString("ascii") === "RIFF"
        && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (!EXTENSIONS[file.type] || buffer.length > MAX_FILE_BYTES || !validSignature) {
    return NextResponse.json({ error: "Use a JPG, PNG, or WebP image up to 5 MB." }, { status: 400 });
  }
  // Use object-storage adapter — provider-neutral key, ACCESS authorized by API
  let url, path;
  try {
    const result = await putProfileMedia({
      userId: session.user.id,
      kind,
      buffer,
      contentType: file.type,
      accessToken: session.token,
    });
    url = result.publicUrl;
    path = result.path;
  } catch {
    return NextResponse.json({ error: "We could not upload that image." }, { status: 502 });
  }
  const update = await fetchAuthProvider(`${SUPABASE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ data: { ...(session.user.user_metadata || {}), [MEDIA_TYPES[kind]]: url } }),
  });
  if (!update.ok) {
    await deleteProfileMedia(path, session.token).catch(() => undefined);
    return NextResponse.json({ error: "The image could not be saved to your profile." }, { status: 502 });
  }
  return NextResponse.json({ url, kind });
}
