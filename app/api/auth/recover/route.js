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
} from "../_utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const rateLimitResponse = enforceAuthRateLimit(request, "recover", 5, 15 * 60 * 1000);
  if (rateLimitResponse) return rateLimitResponse;

  const { email } = await request.json().catch(() => ({}));
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
  }

  const { verifier, challenge } = createPkcePair();
  const redirectTo = `${getSiteUrl(request)}/api/auth/callback`;

  try {
    const authResponse = await fetchAuthProvider(
      `${SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          code_challenge: challenge,
          code_challenge_method: "s256",
        }),
      },
    );

    if (!authResponse.ok && authResponse.status >= 500) {
      throw new Error("Provider unavailable");
    }
  } catch {
    return NextResponse.json(
      { error: "Password recovery is temporarily unavailable. Try again shortly." },
      { status: 503 },
    );
  }

  // Use the same response for known and unknown accounts to prevent email enumeration.
  const response = NextResponse.json({ success: true });
  response.cookies.set(PKCE_VERIFIER_COOKIE, verifier, createCookieOptions(60 * 60));
  response.cookies.set(RECOVERY_FLOW_COOKIE, "1", createCookieOptions(60 * 60));
  return response;
}
