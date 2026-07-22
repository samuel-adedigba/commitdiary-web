import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { resolveDomainRoute } from './lib/domainRouting'

const ACCESS_COOKIE = 'cd_sb_access_token'
const REFRESH_COOKIE = 'cd_sb_refresh_token'
const EXPIRES_COOKIE = 'cd_sb_expires_at'
const API_URL = process.env.API_URL || ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const MARKETING_URL = process.env.NEXT_PUBLIC_MARKETING_URL || ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ''

/**
 * Middleware for security enhancements
 * - Generates CSRF tokens for state-changing operations
 * - Can be extended for rate limiting, bot detection, etc.
 */

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/v1') && API_URL) {
    return proxyApiRequest(request)
  }

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const route = resolveDomainRoute(
    request.nextUrl,
    forwardedHost || request.headers.get('host') || request.nextUrl.host,
    { marketingUrl: MARKETING_URL, appUrl: APP_URL },
  )
  const response = createRouteResponse(request, route)

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

function createRouteResponse(request: NextRequest, route: ReturnType<typeof resolveDomainRoute>) {
  switch (route.action) {
    case 'redirect':
      return NextResponse.redirect(route.url, 308)
    case 'rewrite': {
      const destination = request.nextUrl.clone()
      destination.pathname = route.pathname
      return NextResponse.rewrite(destination)
    }
    default:
      return NextResponse.next()
  }
}

async function proxyApiRequest(request: NextRequest) {
  const targetUrl = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, API_URL)
  const requestHeaders = new Headers(request.headers)

  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value
  const expiresAt = Number(request.cookies.get(EXPIRES_COOKIE)?.value || 0)
  let refreshedSession: Awaited<ReturnType<typeof refreshSession>> = null

  if (refreshToken && (!accessToken || expiresAt - Math.floor(Date.now() / 1000) < 60)) {
    refreshedSession = await refreshSession(refreshToken)
    accessToken = refreshedSession?.access_token || accessToken
  }

  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = NextResponse.rewrite(targetUrl, {
    request: {
      headers: requestHeaders,
    },
  })

  if (refreshedSession) {
    setAuthCookie(response, ACCESS_COOKIE, refreshedSession.access_token, refreshedSession.expires_in)
    setAuthCookie(response, REFRESH_COOKIE, refreshedSession.refresh_token, 60 * 60 * 24 * 30)
    setAuthCookie(response, EXPIRES_COOKIE, String(refreshedSession.expires_at || ''), refreshedSession.expires_in)
  }

  return response
}

async function refreshSession(refreshToken: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

function setAuthCookie(response: NextResponse, name: string, value: string, maxAge?: number) {
  response.cookies.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(maxAge ? { maxAge } : {}),
  })
}

/**
 * Generate a cryptographically secure random token
 */
function generateSecureToken(): string {
  const buffer = new Uint8Array(32)
  crypto.getRandomValues(buffer)
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
