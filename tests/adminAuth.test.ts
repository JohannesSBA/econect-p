import { NextResponse } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret'

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}))

let prismaMock: { user: { findUnique: ReturnType<typeof vi.fn> } }
vi.mock('@/lib/prisma', () => {
  prismaMock = {
    user: {
      findUnique: vi.fn(),
    },
  }
  return {
    __esModule: true,
    default: prismaMock,
  }
})

const { getServerSession } = await import('next-auth/next')
const { requireAdminUser } = await import('@/lib/adminAuth')

describe('requireAdminUser', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns 401 when no session', async () => {
    ;(getServerSession as vi.Mock).mockResolvedValue(null)

    const response = (await requireAdminUser()) as NextResponse
    expect(response instanceof NextResponse).toBe(true)
    expect(response.status).toBe(401)
  })

  it('returns 403 for non-admins', async () => {
    ;(getServerSession as vi.Mock).mockResolvedValue({ user: { email: 'user@test.com' } })
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1', email: 'user@test.com', role: 'USER' })

    const response = (await requireAdminUser()) as NextResponse
    expect(response instanceof NextResponse).toBe(true)
    expect(response.status).toBe(403)
  })

  it('returns user payload for admins', async () => {
    ;(getServerSession as vi.Mock).mockResolvedValue({ user: { email: 'admin@test.com' } })
    const adminUser = { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' }
    prismaMock.user.findUnique.mockResolvedValue(adminUser)

    const result = await requireAdminUser()
    expect(result).toEqual(adminUser)
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'admin@test.com' },
      select: { id: true, email: true, role: true },
    })
  })
})
