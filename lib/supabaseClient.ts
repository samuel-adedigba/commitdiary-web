import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

/**
 * Supabase client with enhanced security configuration
 * 
 * Security features:
 * Auth/session state is handled by server routes with httpOnly cookies.
 * This browser client is kept only for non-auth Supabase features like Realtime.
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
