import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret'

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}))

let mockPrisma: {
  user: { findUnique: ReturnType<typeof vi.fn> }
  jobListing: { findUnique: ReturnType<typeof vi.fn> }
  payment: {
    create: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
}

vi.mock('@/lib/prisma', () => {
  mockPrisma = {
    user: { findUnique: vi.fn() },
    jobListing: { findUnique: vi.fn() },
    payment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  }
  return {
    __esModule: true,
    default: mockPrisma,
  }
})

const { getServerSession } = await import('next-auth/next')
const { POST: checkoutPOST } = await import('@/app/api/payments/chapa/checkout/route')
const { POST: confirmPOST } = await import('@/app/api/payments/chapa/confirm/route')

const employerUser = { id: 'emp-1', email: 'emp@test.com', role: 'EMPLOYER' }
const adminUser = { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' }

const fetchSpy = vi.spyOn(globalThis, 'fetch' as any)

describe('payments: checkout', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.CHAPA_SECRET_KEY = ''
    process.env.TEST_SECRET_KEY = ''
    process.env.CHAPA_DEV_CONFIRM = ''
  })

  afterEach(() => {
    fetchSpy.mockReset()
  })

  it('rejects unauthenticated users', async () => {
    ;(getServerSession as vi.Mock).mockResolvedValue(null)
    const req = new NextRequest(new Request('http://localhost/api/payments/chapa/checkout', { method: 'POST' }))
    const res = await checkoutPOST(req)
    expect(res.status).toBe(401)
  })

  it('rejects non-employers', async () => {
    ;(getServerSession as vi.Mock).mockResolvedValue({ user: { email: 'user@test.com' } })
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'user@test.com', role: 'USER' })
    const req = new NextRequest(
      new Request('http://localhost/api/payments/chapa/checkout', {
        method: 'POST',
        body: JSON.stringify({ jobId: 'job-1', amount: 100 }),
      }),
    )
    const res = await checkoutPOST(req)
    expect(res.status).toBe(403)
  })

  it('applies discount codes without calling the gateway', async () => {
    ;(getServerSession as vi.Mock).mockResolvedValue({ user: { email: employerUser.email } })
    mockPrisma.user.findUnique.mockResolvedValue(employerUser)
    mockPrisma.jobListing.findUnique.mockResolvedValue({
      id: 'job-1',
      employerId: employerUser.id,
      title: 'My Job',
      company: 'ACME',
    })
    mockPrisma.payment.create.mockResolvedValue({ id: 'pay-1' })

    const req = new NextRequest(
      new Request('http://localhost/api/payments/chapa/checkout', {
        method: 'POST',
        body: JSON.stringify({ jobId: 'job-1', discountCode: 'free' }),
      }),
    )
    const res = await checkoutPOST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.discountApplied).toBe(true)
    expect(mockPrisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: 0, status: 'PAID' }),
      }),
    )
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('initializes checkout session with gateway when no discount', async () => {
    ;(getServerSession as vi.Mock).mockResolvedValue({ user: { email: employerUser.email } })
    mockPrisma.user.findUnique.mockResolvedValue(employerUser)
    mockPrisma.jobListing.findUnique.mockResolvedValue({
      id: 'job-2',
      employerId: employerUser.id,
      title: 'Dev Role',
      company: 'ACME',
    })
    mockPrisma.payment.create.mockResolvedValue({ id: 'pay-2' })
    process.env.CHAPA_SECRET_KEY = 'sk_test'

    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success', data: { checkout_url: 'https://pay.test/session' } }),
    } as any)

    const req = new NextRequest(
      new Request('http://localhost/api/payments/chapa/checkout', {
        method: 'POST',
        body: JSON.stringify({ jobId: 'job-2', amount: 1200, currency: 'ETB' }),
      }),
    )
    const res = await checkoutPOST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.checkout.hosted_url).toContain('https://pay.test/session')
    expect(mockPrisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: 1200, status: 'PENDING' }),
      }),
    )
    expect(fetchSpy).toHaveBeenCalled()
  })
})

describe('payments: confirm', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.CHAPA_DEV_CONFIRM = ''
  })

  afterEach(() => {
    fetchSpy.mockReset()
  })

  it('rejects unauthenticated users', async () => {
    ;(getServerSession as vi.Mock).mockResolvedValue(null)
    const req = new NextRequest(new Request('http://localhost/api/payments/chapa/confirm', { method: 'POST' }))
    const res = await confirmPOST(req)
    expect(res.status).toBe(401)
  })

  it('returns 404 when payment is missing', async () => {
    ;(getServerSession as vi.Mock).mockResolvedValue({ user: { email: employerUser.email } })
    mockPrisma.user.findUnique.mockResolvedValue(employerUser)
    mockPrisma.payment.findUnique.mockResolvedValue(null)

    const req = new NextRequest(
      new Request('http://localhost/api/payments/chapa/confirm', {
        method: 'POST',
        body: JSON.stringify({ paymentId: 'missing' }),
      }),
    )
    const res = await confirmPOST(req)
    expect(res.status).toBe(404)
  })

  it('rejects when payment belongs to another user', async () => {
    ;(getServerSession as vi.Mock).mockResolvedValue({ user: { email: employerUser.email } })
    mockPrisma.user.findUnique.mockResolvedValue(employerUser)
    mockPrisma.payment.findUnique.mockResolvedValue({
      id: 'pay-3',
      employerId: 'other-user',
      reference: 'ref-3',
      jobId: 'job-3',
      metadata: {},
    })

    const req = new NextRequest(
      new Request('http://localhost/api/payments/chapa/confirm', {
        method: 'POST',
        body: JSON.stringify({ paymentId: 'pay-3' }),
      }),
    )
    const res = await confirmPOST(req)
    expect(res.status).toBe(403)
  })

  it('short-circuits in dev confirm mode', async () => {
    process.env.CHAPA_DEV_CONFIRM = 'true'
    ;(getServerSession as vi.Mock).mockResolvedValue({ user: { email: employerUser.email } })
    mockPrisma.user.findUnique.mockResolvedValue(employerUser)
    mockPrisma.payment.findUnique.mockResolvedValue({
      id: 'pay-4',
      employerId: employerUser.id,
      reference: 'ref-4',
      jobId: 'job-4',
      metadata: {},
    })
    mockPrisma.payment.update.mockResolvedValue({})

    const req = new NextRequest(
      new Request('http://localhost/api/payments/chapa/confirm', {
        method: 'POST',
        body: JSON.stringify({ paymentId: 'pay-4' }),
      }),
    )
    const res = await confirmPOST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.mode).toBe('dev')
    expect(mockPrisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'pay-4' },
      data: { status: 'PAID' },
    })
  })

  it('verifies with gateway and marks paid on success', async () => {
    process.env.CHAPA_SECRET_KEY = 'sk_test'
    ;(getServerSession as vi.Mock).mockResolvedValue({ user: { email: employerUser.email } })
    mockPrisma.user.findUnique.mockResolvedValue(employerUser)
    mockPrisma.payment.findUnique.mockResolvedValue({
      id: 'pay-5',
      employerId: employerUser.id,
      reference: 'ref-5',
      jobId: 'job-5',
      metadata: {},
    })
    mockPrisma.payment.update.mockResolvedValue({})

    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success', data: { status: 'success' } }),
    } as any)

    const req = new NextRequest(
      new Request('http://localhost/api/payments/chapa/confirm', {
        method: 'POST',
        body: JSON.stringify({ paymentId: 'pay-5' }),
      }),
    )
    const res = await confirmPOST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.mode).toBe('verify')
    expect(mockPrisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'pay-5' },
      data: expect.objectContaining({
        status: 'PAID',
        metadata: expect.objectContaining({ chapaVerification: expect.anything() }),
      }),
    })
  })
})
