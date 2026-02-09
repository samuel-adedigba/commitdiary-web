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
 * - Auto-refresh tokens before expiry
 * - Persistent sessions across page reloads
 * - Session detection from URL (for email confirmations)
 * - Local storage for session persistence (consider httpOnly cookies for production)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Automatically refresh tokens before they expire
    autoRefreshToken: true,
    
    // Persist session in localStorage (survives page reloads)
    persistSession: true,
    
    // Detect and handle session from URL hash (email confirmations, magic links)
    detectSessionInUrl: true,
    
    // Storage configuration (currently localStorage)
    // NOTE: For enhanced security in production, consider implementing httpOnly cookies
    // See SECURITY_AUDIT.md for implementation details
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    
    // Use implicit flow for SPAs (default for Supabase)
    // Note: PKCE is more secure but requires additional Supabase project configuration
    flowType: 'implicit',
  },
  
  global: {
    headers: {
      'X-Client-Info': 'commitdiary-web-dashboard',
    },
  },
});

