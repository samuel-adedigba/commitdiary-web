import { NextResponse } from "next/server";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  clearSessionCookies,
  enforceAuthRateLimit,
  fetchAuthProvider,
  setSessionCookies,
} from "../_utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const rateLimitResponse = enforceAuthRateLimit(request, "password", 10, 15 * 60 * 1000);
  if (rateLimitResponse) return rateLimitResponse;

  const { email, password } = await request.json().catch(() => ({}));

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.length > 254 ||
    password.length > 1024 ||
    !EMAIL_PATTERN.test(email)
  ) {
    return NextResponse.json({ error: "Enter a valid email and password" }, { status: 400 });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Authentication is not configured" }, { status: 503 });
  }

  let authResponse;
  try {
    authResponse = await fetchAuthProvider(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
  } catch {
    return NextResponse.json(
      { error: "Authentication is temporarily unavailable. Try again shortly." },
      { status: 503 },
    );
  }

  if (!authResponse.ok) {
    const response = NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    clearSessionCookies(response);
    return response;
  }

  const session = await authResponse.json();
  const response = NextResponse.json({ success: true });
  setSessionCookies(response, session);
  return response;
}
