import { NextResponse } from "next/server";
import {
  PKCE_VERIFIER_COOKIE,
  RECOVERY_FLOW_COOKIE,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  createPkcePair,
  createCookieOptions,
  getSiteUrl,
} from "../../_utils";

const ALLOWED_PROVIDERS = new Set(["github", "google"]);

export async function GET(request, { params }) {
  const { provider } = await params;
  if (!ALLOWED_PROVIDERS.has(provider)) {
    return NextResponse.json({ error: "Unsupported OAuth provider" }, { status: 400 });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Missing Supabase auth configuration" }, { status: 500 });
  }

  const { verifier, challenge } = createPkcePair();
  const redirectTo = `${getSiteUrl(request)}/api/auth/callback`;

  const authorizeUrl = new URL(`${SUPABASE_URL}/auth/v1/authorize`);
  authorizeUrl.searchParams.set("provider", provider);
  authorizeUrl.searchParams.set("redirect_to", redirectTo);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "s256");

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(PKCE_VERIFIER_COOKIE, verifier, createCookieOptions(60 * 10));
  response.cookies.set(RECOVERY_FLOW_COOKIE, "", { ...createCookieOptions(0), maxAge: 0 });
  return response;
}
