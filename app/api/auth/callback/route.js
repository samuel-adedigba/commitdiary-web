import { NextResponse } from "next/server";
import {
  PKCE_VERIFIER_COOKIE,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  clearSessionCookies,
  redirectWithAuthError,
  setSessionCookies,
} from "../_utils";

export async function GET(request) {
  const code = request.nextUrl.searchParams.get("code");
  const verifier = request.cookies.get(PKCE_VERIFIER_COOKIE)?.value;

  if (!code || !verifier) {
    return redirectWithAuthError(request, "missing_oauth_code");
  }

  const tokenResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_code: code,
      code_verifier: verifier,
    }),
  });

  if (!tokenResponse.ok) {
    const response = redirectWithAuthError(request, "oauth_exchange_failed");
    clearSessionCookies(response);
    return response;
  }

  const session = await tokenResponse.json();
  const response = NextResponse.redirect(new URL("/", request.nextUrl.origin));
  setSessionCookies(response, session);
  response.cookies.set(PKCE_VERIFIER_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
