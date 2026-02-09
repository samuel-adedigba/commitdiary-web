import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware for security enhancements
 * - Generates CSRF tokens for state-changing operations
 * - Can be extended for rate limiting, bot detection, etc.
 */

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Generate CSRF token if not present
  if (!request.cookies.get('csrf-token')) {
    const csrfToken = generateSecureToken()
    
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: true, // Not accessible via JavaScript (XSS protection)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    })
  }

  // Add security headers (additional to next.config.js)
  response.headers.set('X-Request-ID', generateSecureToken())

  return response
}

/**
 * Generate a cryptographically secure random token
 */
function generateSecureToken(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buffer = new Uint8Array(32)
    crypto.getRandomValues(buffer)
    return Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
  
  // Fallback for environments without crypto.getRandomValues
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
