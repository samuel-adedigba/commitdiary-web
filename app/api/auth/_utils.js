import crypto from "crypto";
import { NextResponse } from "next/server";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const ACCESS_COOKIE = "cd_sb_access_token";
export const REFRESH_COOKIE = "cd_sb_refresh_token";
export const EXPIRES_COOKIE = "cd_sb_expires_at";
export const PKCE_VERIFIER_COOKIE = "cd_pkce_verifier";
export const RECOVERY_FLOW_COOKIE = "cd_recovery_flow";

const isProduction = process.env.NODE_ENV === "production";
const AUTH_REQUEST_TIMEOUT_MS = 10_000;

export async function fetchAuthProvider(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getSiteUrl(request) {
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
}

export function createCookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    ...(maxAge ? { maxAge } : {}),
  };
}

export function setSessionCookies(response, session) {
  response.cookies.set(ACCESS_COOKIE, session.access_token, createCookieOptions(session.expires_in));
  response.cookies.set(REFRESH_COOKIE, session.refresh_token, createCookieOptions(60 * 60 * 24 * 30));
  response.cookies.set(EXPIRES_COOKIE, String(session.expires_at || ""), createCookieOptions(session.expires_in));
}

export function clearSessionCookies(response) {
  for (const name of [
    ACCESS_COOKIE,
    REFRESH_COOKIE,
    EXPIRES_COOKIE,
    PKCE_VERIFIER_COOKIE,
    RECOVERY_FLOW_COOKIE,
  ]) {
    response.cookies.set(name, "", { ...createCookieOptions(0), maxAge: 0 });
  }
}

export function clearRecoveryCookies(response) {
  for (const name of [PKCE_VERIFIER_COOKIE, RECOVERY_FLOW_COOKIE]) {
    response.cookies.set(name, "", { ...createCookieOptions(0), maxAge: 0 });
  }
}

export function redirectWithAuthError(request, reason) {
  const url = new URL("/authentication/sign-in", getSiteUrl(request));
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

export function base64UrlEncode(buffer) {
  return Buffer.from(buffer)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function createPkcePair() {
  const verifier = base64UrlEncode(crypto.randomBytes(64));
  const challenge = base64UrlEncode(crypto.createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

const rateLimitStore = new Map();

export function enforceAuthRateLimit(request, action, limit, windowMs) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientId = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  const key = `${action}:${clientId}`;
  const now = Date.now();

  if (rateLimitStore.size > 5_000) {
    for (const [storedKey, entry] of rateLimitStore) {
      if (entry.resetAt <= now) rateLimitStore.delete(storedKey);
    }
  }

  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (current.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Too many attempts. Wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  current.count += 1;
  return null;
}
