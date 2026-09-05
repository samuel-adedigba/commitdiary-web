import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  clearSessionCookies,
  fetchAuthProvider,
} from "../_utils";

export async function POST(request) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  if (accessToken && SUPABASE_URL && SUPABASE_ANON_KEY) {
    // Revoke the provider session before clearing browser cookies. Cookie
    // clearing alone leaves a stolen access token usable until expiry.
    await fetchAuthProvider(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    }).catch(() => undefined);
  }
  const response = NextResponse.json({ success: true });
  clearSessionCookies(response);
  return response;
}
