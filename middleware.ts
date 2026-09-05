import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { resolveDomainRoute } from './lib/domainRouting'
// Auth provider adapter — single place that knows Supabase Auth endpoint shapes.
// Middleware keeps the HttpOnly-cookie contract stable; provider swap changes only authProvider.
import { authProvider } from './lib/authProvider'
import { createApiProxyHeaders } from './lib/apiProxyHeaders'

const ACCESS_COOKIE = 'cd_sb_access_token'
const REFRESH_COOKIE = 'cd_sb_refresh_token'
const EXPIRES_COOKIE = 'cd_sb_expires_at'
const API_URL = process.env.API_URL || ''
const SUPABASE_URL = authProvider.getSupabaseUrl() || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = authProvider.getAnonKey() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const MARKETING_URL = process.env.NEXT_PUBLIC_MARKETING_URL || ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ''

/**
 * Middleware for security enhancements
 * - Generates CSRF tokens for state-changing operations
 * - Can be extended for rate limiting, bot detection, etc.
 */

export async function middleware(request: NextRequest) {
  const csrfError = validateCsrfRequest(request)
  if (csrfError) return csrfError

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
      // Double-submit CSRF tokens must be readable by the browser client so it
      // can echo the value in X-CSRF-Token. The session cookies remain HttpOnly.
      httpOnly: false,
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

function validateCsrfRequest(request: NextRequest): NextResponse | null {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return null
  const path = request.nextUrl.pathname
  if (!path.startsWith('/api/auth') && !path.startsWith('/v1')) return null

  const cookieToken = request.cookies.get('csrf-token')?.value
  const headerToken = request.headers.get('x-csrf-token')
  if (!cookieToken || !headerToken || cookieToken.length > 128 || headerToken.length > 128 || cookieToken !== headerToken) {
    return NextResponse.json({ error: 'Invalid CSRF token', code: 'CSRF_INVALID' }, { status: 403 })
  }
  return null
}

async function proxyApiRequest(request: NextRequest) {
  const targetUrl = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, API_URL)

  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value
  const expiresAt = Number(request.cookies.get(EXPIRES_COOKIE)?.value || 0)
  let refreshedSession: Awaited<ReturnType<typeof refreshSession>> = null

  if (refreshToken && (!accessToken || expiresAt - Math.floor(Date.now() / 1000) < 60)) {
    refreshedSession = await refreshSession(refreshToken)
    accessToken = refreshedSession?.access_token || accessToken
  }

  const requestHeaders = createApiProxyHeaders(request.headers, accessToken)

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
  // Delegate to provider adapter so middleware does not hardcode auth endpoint shape outside adapter
  if (!authProvider.isConfigured()) return null
  try {
    return await authProvider.refreshSession(refreshToken)
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
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!commitdiary-dev/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
