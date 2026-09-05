import { createApiProxyHeaders } from '../apiProxyHeaders'

describe('createApiProxyHeaders', () => {
  it('does not forward browser cookies or a caller-supplied authorization header', () => {
    const headers = createApiProxyHeaders({
      cookie: 'cd_sb_access_token=secret; other=value',
      authorization: 'Bearer attacker-controlled',
      'content-type': 'application/json',
    }, 'verified-token')

    expect(headers.has('cookie')).toBe(false)
    expect(headers.get('authorization')).toBe('Bearer verified-token')
    expect(headers.get('content-type')).toBe('application/json')
  })

  it('removes authorization when no verified session exists', () => {
    const headers = createApiProxyHeaders({ authorization: 'Bearer unverified' })
    expect(headers.has('authorization')).toBe(false)
  })

  it('forwards only allowlisted headers and drops everything else', () => {
    const headers = createApiProxyHeaders({
      cookie: 'cd_sb_access_token=secret',
      authorization: 'Bearer attacker-controlled',
      'x-api-key': 'attacker-key',
      'x-forwarded-for': '1.2.3.4',
      referer: 'https://evil.example/',
      'user-agent': 'evil-bot',
      'content-type': 'application/json',
      accept: 'application/json',
      'x-request-id': 'req-123',
    }, 'verified-token')

    expect(headers.has('cookie')).toBe(false)
    expect(headers.has('x-api-key')).toBe(false)
    expect(headers.has('x-forwarded-for')).toBe(false)
    expect(headers.has('referer')).toBe(false)
    expect(headers.has('user-agent')).toBe(false)
    expect(headers.get('authorization')).toBe('Bearer verified-token')
    expect(headers.get('content-type')).toBe('application/json')
    expect(headers.get('accept')).toBe('application/json')
    expect(headers.get('x-request-id')).toBe('req-123')
  })

  it('forwards idempotency keys for protected billing mutations', () => {
    const headers = createApiProxyHeaders({
      'idempotency-key': 'checkout-key-123456',
    }, 'verified-token')

    expect(headers.get('idempotency-key')).toBe('checkout-key-123456')
  })
})
