import { NextResponse } from "next/server";
import {
  PKCE_VERIFIER_COOKIE,
  RECOVERY_FLOW_COOKIE,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  clearRecoveryCookies,
  clearSessionCookies,
  fetchAuthProvider,
  getSiteUrl,
  redirectWithAuthError,
  setSessionCookies,
} from "../_utils";

export async function GET(request) {
  const code = request.nextUrl.searchParams.get("code");
  const verifier = request.cookies.get(PKCE_VERIFIER_COOKIE)?.value;

  if (!code || !verifier) {
    return redirectWithAuthError(request, "missing_oauth_code");
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return redirectWithAuthError(request, "authentication_not_configured");
  }

  let tokenResponse;
  try {
    tokenResponse = await fetchAuthProvider(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
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
  } catch {
    const response = redirectWithAuthError(request, "authentication_service_unavailable");
    clearSessionCookies(response);
    return response;
  }

  if (!tokenResponse.ok) {
    const response = redirectWithAuthError(request, "oauth_exchange_failed");
    clearSessionCookies(response);
    return response;
  }

  const session = await tokenResponse.json();
  if (!session.access_token || !session.refresh_token) {
    const response = redirectWithAuthError(request, "oauth_exchange_failed");
    clearSessionCookies(response);
    return response;
  }

  const isRecovery = request.cookies.get(RECOVERY_FLOW_COOKIE)?.value === "1";
  const destination = isRecovery ? "/authentication/reset-password" : "/dashboard";
  const response = NextResponse.redirect(new URL(destination, getSiteUrl(request)));
  setSessionCookies(response, session);
  clearRecoveryCookies(response);
  return response;
}
