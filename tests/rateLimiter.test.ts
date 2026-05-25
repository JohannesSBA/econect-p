import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { rateLimit } from '@/lib/rateLimiter'

function makeReq(ip: string) {
  const req = new NextRequest('http://example.com') as any
  req.ip = ip
  return req as any
}

describe('rateLimit', () => {
  beforeEach(() => {
    // Clear buckets between tests
    const globalKey = '__rateLimiterBuckets'
    ;(globalThis as any)[globalKey]?.clear?.()
  })

  it('allows initial requests and decrements remaining', () => {
    const result = rateLimit(makeReq('1.1.1.1'), 'test', 2, 1000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(1)
  })

  it('blocks after exceeding limit', () => {
    const req = makeReq('2.2.2.2')
    rateLimit(req, 'test', 1, 1000)
    const blocked = rateLimit(req, 'test', 1, 1000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('resets after window passes', () => {
    const req = makeReq('3.3.3.3')
    rateLimit(req, 'test', 1, 1)
    // simulate wait
    const bucket = (globalThis as any).__rateLimiterBuckets.get('test:3.3.3.3')
    bucket.reset = Date.now() - 1
    const allowed = rateLimit(req, 'test', 1, 1)
    expect(allowed.allowed).toBe(true)
  })
})
