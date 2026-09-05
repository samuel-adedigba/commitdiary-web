import crypto from "crypto";
import { NextResponse } from "next/server";
// Single adapter import — all Supabase Auth HTTP details live in authProvider
import { authProvider, fetchAuthProvider as adapterFetch } from "../../../lib/authProvider";

export const SUPABASE_URL = authProvider.getSupabaseUrl() || process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = authProvider.getAnonKey() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const ACCESS_COOKIE = "cd_sb_access_token";
export const REFRESH_COOKIE = "cd_sb_refresh_token";
export const EXPIRES_COOKIE = "cd_sb_expires_at";
export const PKCE_VERIFIER_COOKIE = "cd_pkce_verifier";
export const RECOVERY_FLOW_COOKIE = "cd_recovery_flow";
export const AUTH_NEXT_COOKIE = "cd_auth_next";

const isProduction = process.env.NODE_ENV === "production";
const API_URL = process.env.API_URL || "";
const AUTH_RATE_LIMIT_SECRET = process.env.AUTH_RATE_LIMIT_SECRET || "";

export async function fetchAuthProvider(url, options = {}) {
  return adapterFetch(url, options);
}

export function getSiteUrl(request) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!configuredUrl && isProduction) {
    throw new Error("NEXT_PUBLIC_APP_URL must be configured in production");
  }

  const candidate = configuredUrl || request.nextUrl.origin;
  const parsed = new URL(candidate);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error("NEXT_PUBLIC_APP_URL must use HTTP(S)");
  }
  if (isProduction && parsed.protocol !== 'https:') {
    throw new Error("NEXT_PUBLIC_APP_URL must use HTTPS in production");
  }
  return parsed.origin;
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
    AUTH_NEXT_COOKIE,
  ]) {
    response.cookies.set(name, "", { ...createCookieOptions(0), maxAge: 0 });
  }
}

export function clearRecoveryCookies(response) {
  for (const name of [PKCE_VERIFIER_COOKIE, RECOVERY_FLOW_COOKIE, AUTH_NEXT_COOKIE]) {
    response.cookies.set(name, "", { ...createCookieOptions(0), maxAge: 0 });
  }
}

export function publicUserMetadata(metadata) {
  const source = metadata && typeof metadata === "object" ? metadata : {};
  return Object.fromEntries(
    ["full_name", "username", "avatar_url", "cover_url"]
      .filter((key) => typeof source[key] === "string")
      .map((key) => [key, source[key]]),
  );
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

function localAuthRateLimit(request, action, limit, windowMs) {
  const trustProxy = process.env.TRUST_PROXY === "true";
  const forwardedFor = trustProxy ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() : null;
  const clientId = forwardedFor || (trustProxy ? request.headers.get("x-real-ip") : null) || "anonymous";
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

export async function enforceAuthRateLimit(request, action, limit, windowMs) {
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const trustProxy = process.env.TRUST_PROXY === "true";
  const forwardedFor = trustProxy ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() : null;
  const clientId = forwardedFor || (trustProxy ? request.headers.get("x-real-ip") : null) || "anonymous";

  if (API_URL && AUTH_RATE_LIMIT_SECRET) {
    try {
      const response = await fetch(`${API_URL}/v1/internal/auth/rate-limit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Rate-Limit-Secret": AUTH_RATE_LIMIT_SECRET,
        },
        body: JSON.stringify({ action, clientId, windowSeconds, maxRequests: limit }),
        cache: "no-store",
      });
      if (response.ok) return null;
      const payload = await response.json().catch(() => null);
      if (response.status === 429) {
        const retryAfter = Number.parseInt(response.headers.get("Retry-After") || String(windowSeconds), 10);
        return NextResponse.json(
          { error: "Too many attempts. Wait a few minutes and try again.", code: "RATE_LIMITED" },
          { status: 429, headers: { "Retry-After": String(Number.isFinite(retryAfter) ? retryAfter : windowSeconds) } },
        );
      }
      return NextResponse.json(
        { error: payload?.error || "Authentication protection is temporarily unavailable.", code: "RATE_LIMIT_UNAVAILABLE" },
        { status: 503 },
      );
    } catch {
      return NextResponse.json(
        { error: "Authentication protection is temporarily unavailable.", code: "RATE_LIMIT_UNAVAILABLE" },
        { status: 503 },
      );
    }
  }

  if (isProduction) {
    return NextResponse.json(
      { error: "Authentication protection is not configured.", code: "RATE_LIMIT_UNAVAILABLE" },
      { status: 503 },
    );
  }
  return localAuthRateLimit(request, action, limit, windowMs);
}
