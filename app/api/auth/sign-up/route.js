import { NextResponse } from "next/server";
import {
  PKCE_VERIFIER_COOKIE,
  RECOVERY_FLOW_COOKIE,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  createCookieOptions,
  createPkcePair,
  enforceAuthRateLimit,
  fetchAuthProvider,
  getSiteUrl,
  setSessionCookies,
} from "../_utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])$/;

export async function POST(request) {
  const rateLimitResponse = enforceAuthRateLimit(request, "sign-up", 5, 60 * 60 * 1000);
  if (rateLimitResponse) return rateLimitResponse;

  const { email, password, username } = await request.json().catch(() => ({}));
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedUsername = typeof username === "string" ? username.trim().toLowerCase() : "";

  if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!USERNAME_PATTERN.test(normalizedUsername)) {
    return NextResponse.json(
      { error: "Use 3–30 lowercase letters, numbers, hyphens, or underscores for your username." },
      { status: 400 },
    );
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 1024) {
    return NextResponse.json({ error: "Use a password with at least 8 characters." }, { status: 400 });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
  }

  const { verifier, challenge } = createPkcePair();
  const redirectTo = `${getSiteUrl(request)}/api/auth/callback`;
  let authResponse;

  try {
    authResponse = await fetchAuthProvider(
      `${SUPABASE_URL}/auth/v1/signup?redirect_to=${encodeURIComponent(redirectTo)}`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          data: { username: normalizedUsername },
          code_challenge: challenge,
          code_challenge_method: "s256",
        }),
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Account creation is temporarily unavailable. Try again shortly." },
      { status: 503 },
    );
  }

  if (!authResponse.ok) {
    return NextResponse.json(
      { error: "We could not create that account. Check your details or sign in instead." },
      { status: authResponse.status === 429 ? 429 : 400 },
    );
  }

  const result = await authResponse.json();
  const response = NextResponse.json({
    success: true,
    confirmationRequired: !result.access_token,
  });
  response.cookies.set(PKCE_VERIFIER_COOKIE, verifier, createCookieOptions(60 * 60 * 24));
  response.cookies.set(RECOVERY_FLOW_COOKIE, "", { ...createCookieOptions(0), maxAge: 0 });

  if (result.access_token && result.refresh_token) {
    setSessionCookies(response, result);
  }

  return response;
}
