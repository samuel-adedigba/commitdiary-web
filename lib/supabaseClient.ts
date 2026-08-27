import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Supabase client — Realtime adapter implementation (provider-specific).
 * This browser client is the current Realtime provider behind lib/realtimeAdapter.
 * Do not add direct table queries here; all product data must go through the
 * CommitDiary API (see lib/apiClient). Auth/session is handled by server routes
 * with HttpOnly cookies via lib/authProvider.
 *
 * Future VPS: replace with WebSocket/SSE + LISTEN/NOTIFY adapter without
 * changing realtimeAdapter consumers.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    
    persistSession: false,
    
    // PKCE callback page handles code exchange; do not auto-parse URL session fragments.
    detectSessionInUrl: false,
    
    // Use PKCE to avoid exposing access tokens in URL fragments.
    flowType: 'pkce',
  },
  
  global: {
    headers: {
      'X-Client-Info': 'commitdiary-web-dashboard',
    },
  },
});
