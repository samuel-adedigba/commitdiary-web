const FORWARDED_HEADERS = ['content-type', 'accept', 'x-csrf-token', 'x-request-id', 'idempotency-key'] as const

export function createApiProxyHeaders(source: HeadersInit, accessToken?: string): Headers {
  const incoming = new Headers(source)
  // Browser session cookies terminate at the dashboard and caller-supplied
  // credentials are never trusted. Build a fresh allowlisted header set so
  // only the headers the API service needs cross the service boundary, plus
  // the bearer credential derived from the verified session.
  const headers = new Headers()
  for (const name of FORWARDED_HEADERS) {
    const value = incoming.get(name)
    if (value !== null) headers.set(name, value)
  }
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`)
  return headers
}
