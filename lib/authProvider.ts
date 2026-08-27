/**
 * Auth provider adapter — isolates Supabase Auth behind a stable HttpOnly-cookie contract.
 * The dashboard currently uses Supabase Auth; this module is the single place that
 * constructs Supabase Auth URLs so a future provider swap changes only this file.
 *
 * Keep cookie names stable (cd_sb_access_token etc.) so cutover changes configuration,
 * not product contracts.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

const AUTH_REQUEST_TIMEOUT_MS = 10_000;

async function fetchAuthProvider(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function requireSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase auth configuration (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)");
  }
}

export type AuthUser = {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  [k: string]: unknown;
};

export type SessionTokens = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
};

export const authProvider = {
  getSupabaseUrl() {
    return SUPABASE_URL;
  },
  getAnonKey() {
    return SUPABASE_ANON_KEY;
  },
  isConfigured() {
    return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
  },

  async getUser(accessToken: string): Promise<AuthUser | null> {
    requireSupabaseConfig();
    const res = await fetchAuthProvider(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return res.json();
  },

  async refreshSession(refreshToken: string): Promise<SessionTokens | null> {
    requireSupabaseConfig();
    const res = await fetchAuthProvider(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    return res.json();
  },

  async exchangePkceCode(code: string, verifier: string): Promise<SessionTokens | null> {
    requireSupabaseConfig();
    const res = await fetchAuthProvider(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
    });
    if (!res.ok) return null;
    return res.json();
  },

  async signUpWithPassword(opts: { email: string; password: string; username?: string; codeChallenge: string }) {
    requireSupabaseConfig();
    return fetchAuthProvider(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: opts.email,
        password: opts.password,
        data: opts.username ? { username: opts.username } : undefined,
        code_challenge: opts.codeChallenge,
        code_challenge_method: "s256",
      }),
    });
  },

  async signInWithPassword(email: string, password: string) {
    requireSupabaseConfig();
    return fetchAuthProvider(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  },

  async authorizeUrl(provider: string, redirectTo: string, codeChallenge: string) {
    requireSupabaseConfig();
    const params = new URLSearchParams({
      provider,
      redirect_to: redirectTo,
      code_challenge: codeChallenge,
      code_challenge_method: "s256",
    });
    return `${SUPABASE_URL}/auth/v1/authorize?${params.toString()}`;
  },

  async recover(email: string, redirectTo: string, codeChallenge: string) {
    requireSupabaseConfig();
    return fetchAuthProvider(`${SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, code_challenge: codeChallenge, code_challenge_method: "s256" }),
    });
  },

  async updateUser(accessToken: string, payload: Record<string, unknown>) {
    requireSupabaseConfig();
    return fetchAuthProvider(`${SUPABASE_URL}/auth/v1/user`, {
      method: "PUT",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async uploadProfileMedia(accessToken: string, path: string, buffer: Buffer, contentType: string) {
    requireSupabaseConfig();
    return fetchAuthProvider(`${SUPABASE_URL}/storage/v1/object/profile-media/${path}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": contentType,
        "x-upsert": "false",
        "cache-control": "3600",
      },
      body: buffer as any,
    });
  },

  publicUrlForProfileMedia(path: string) {
    // Provider-neutral stable asset ID -> public URL
    // Currently Supabase Storage public URL; future S3 will use signed URL or API-streamed response
    return `${SUPABASE_URL}/storage/v1/object/public/profile-media/${path}`;
  },
};

export { fetchAuthProvider };
