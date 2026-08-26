import crypto from "crypto";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE, SUPABASE_ANON_KEY, SUPABASE_URL, fetchAuthProvider } from "../_utils";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MEDIA_TYPES = { avatar: "avatar_url", cover: "cover_url" };
const EXTENSIONS = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

async function getAuthenticatedUser(request) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const response = await fetchAuthProvider(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  return { token, user: await response.json() };
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
  return NextResponse.json({ user: { id: user.id, email: user.email, user_metadata: user.user_metadata || {} } });
}

export async function POST(request) {
  const session = await getAuthenticatedUser(request);
  if (!session) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  const formData = await request.formData();
  const kind = formData.get("kind");
  const file = formData.get("file");
  if (!Object.hasOwn(MEDIA_TYPES, kind) || !file || typeof file.arrayBuffer !== "function") {
    return NextResponse.json({ error: "Choose a valid profile image." }, { status: 400 });
  }
  if (!EXTENSIONS[file.type] || file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Use a JPG, PNG, or WebP image up to 5 MB." }, { status: 400 });
  }
  const path = `${session.user.id}/${kind}-${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
  const upload = await fetchAuthProvider(`${SUPABASE_URL}/storage/v1/object/profile-media/${path}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.token}`, "Content-Type": file.type, "x-upsert": "false", "cache-control": "3600" },
    body: Buffer.from(await file.arrayBuffer()),
  });
  if (!upload.ok) return NextResponse.json({ error: "We could not upload that image." }, { status: 502 });
  const url = `${SUPABASE_URL}/storage/v1/object/public/profile-media/${path}`;
  const update = await fetchAuthProvider(`${SUPABASE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ data: { ...(session.user.user_metadata || {}), [MEDIA_TYPES[kind]]: url } }),
  });
  if (!update.ok) return NextResponse.json({ error: "The image uploaded but could not be saved to your profile." }, { status: 502 });
  return NextResponse.json({ url, kind });
}
