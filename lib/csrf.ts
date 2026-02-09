/**
 * CSRF Protection Utilities
 * Use these in API routes that perform state-changing operations (POST, PUT, DELETE)
 */

import { NextRequest } from 'next/server'

/**
 * Validate CSRF token from request
 * Call this in API routes before processing mutations
 * 
 * @example
 * ```typescript
 * // In your API route:
 * export async function POST(request: NextRequest) {
 *   if (!validateCsrfToken(request)) {
 *     return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
 *   }
 *   // Process request...
 * }
 * ```
 */
export function validateCsrfToken(request: NextRequest): boolean {
  // Only validate for state-changing methods
  const method = request.method
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return true // GET requests don't need CSRF protection
  }

  // Get CSRF token from cookie
  const cookieToken = request.cookies.get('csrf-token')?.value

  // Get CSRF token from header (sent by client)
  const headerToken = request.headers.get('x-csrf-token')

  // Both must exist and match
  if (!cookieToken || !headerToken) {
    return false
  }

  if (cookieToken !== headerToken) {
    return false
  }

  return true
}

/**
 * Get CSRF token from cookie (client-side)
 * Use this to include the token in API requests
 * 
 * @example
 * ```typescript
 * const csrfToken = getCsrfToken()
 * await fetch('/api/data', {
 *   method: 'POST',
 *   headers: {
 *     'x-csrf-token': csrfToken,
 *     'Content-Type': 'application/json'
 *   },
 *   body: JSON.stringify(data)
 * })
 * ```
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') {
    return null // Server-side, no cookies available
  }

  const cookies = document.cookie.split(';')
  const csrfCookie = cookies.find(c => c.trim().startsWith('csrf-token='))
  
  if (!csrfCookie) {
    return null
  }

  return csrfCookie.split('=')[1]
}

/**
 * Add CSRF token to fetch options
 * Convenience wrapper for adding CSRF headers
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/data', withCsrfToken({
 *   method: 'POST',
 *   body: JSON.stringify(data)
 * }))
 * ```
 */
export function withCsrfToken(options: RequestInit = {}): RequestInit {
  const csrfToken = getCsrfToken()
  
  if (!csrfToken) {
    return options
  }

  return {
    ...options,
    headers: {
      ...options.headers,
      'x-csrf-token': csrfToken,
    },
  }
}

/**
 * React hook for CSRF-protected API calls
 * Use this in components to automatically include CSRF tokens
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { secureFetch } = useSecureFetch()
 * 
 *   const handleSubmit = async () => {
 *     const response = await secureFetch('/api/data', {
 *       method: 'POST',
 *       body: JSON.stringify(data)
 *     })
 *   }
 * }
 * ```
 */
export function useSecureFetch() {
  const secureFetch = async (url: string, options: RequestInit = {}) => {
    return fetch(url, withCsrfToken(options))
  }

  return { secureFetch, getCsrfToken }
}
