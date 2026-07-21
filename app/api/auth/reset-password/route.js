import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  clearRecoveryCookies,
  clearSessionCookies,
  enforceAuthRateLimit,
  fetchAuthProvider,
} from "../_utils";

export async function POST(request) {
  const rateLimitResponse = enforceAuthRateLimit(request, "reset-password", 5, 15 * 60 * 1000);
  if (rateLimitResponse) return rateLimitResponse;

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const { password } = await request.json().catch(() => ({}));

  if (typeof password !== "string" || password.length < 8 || password.length > 1024) {
    return NextResponse.json({ error: "Use a password with at least 8 characters." }, { status: 400 });
  }

  if (!accessToken) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new link." },
      { status: 401 },
    );
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
  }

  let authResponse;
  try {
    authResponse = await fetchAuthProvider(`${SUPABASE_URL}/auth/v1/user`, {
      method: "PUT",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });
  } catch {
    return NextResponse.json(
      { error: "We could not update your password. Check your connection and try again." },
      { status: 503 },
    );
  }

  if (!authResponse.ok) {
    const response = NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new link." },
      { status: authResponse.status === 401 ? 401 : 400 },
    );
    if (authResponse.status === 401) clearSessionCookies(response);
    return response;
  }

  const response = NextResponse.json({ success: true });
  clearRecoveryCookies(response);
  return response;
}
