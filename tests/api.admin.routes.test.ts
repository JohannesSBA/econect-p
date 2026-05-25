import { NextRequest, NextResponse } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { JobStatus } from '@/generated/prisma'

vi.mock('@/lib/adminAuth', () => ({
  requireAdminUser: vi.fn(),
}))

vi.mock('@/services/adminJobs', () => ({
  listJobs: vi.fn(),
  updateJobs: vi.fn(),
}))

vi.mock('@/services/adminEmployers', () => ({
  listEmployers: vi.fn(),
  updateEmployers: vi.fn(),
}))

const { requireAdminUser } = await import('@/lib/adminAuth')
const { listJobs, updateJobs } = await import('@/services/adminJobs')
const { listEmployers, updateEmployers } = await import('@/services/adminEmployers')
const { GET: jobsGET, PATCH: jobsPATCH } = await import('@/app/api/admin/jobs/route')
const { GET: employersGET, PATCH: employersPATCH } = await import('@/app/api/admin/employers/route')

const adminUser = { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' }

describe('admin jobs API', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('short-circuits with guard response on GET', async () => {
    ;(requireAdminUser as vi.Mock).mockImplementation(() => {
      throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    })

    const req = new NextRequest(new Request('http://localhost/api/admin/jobs'))
    const res = await jobsGET(req)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns paginated jobs on GET', async () => {
    ;(requireAdminUser as vi.Mock).mockResolvedValue(adminUser)
    ;(listJobs as vi.Mock).mockResolvedValue({ jobs: [{ id: 'job-1' }], total: 1 })

    const req = new NextRequest(
      new Request('http://localhost/api/admin/jobs?q=fintech&page=2&pageSize=5&status=OPEN'),
    )
    const res = await jobsGET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(listJobs).toHaveBeenCalledWith({
      search: 'fintech',
      status: 'OPEN' as JobStatus,
      page: 2,
      pageSize: 5,
    })
    expect(data).toMatchObject({ jobs: [{ id: 'job-1' }], total: 1, page: 2, pageSize: 5 })
  })

  it('rejects invalid PATCH payloads', async () => {
    ;(requireAdminUser as vi.Mock).mockResolvedValue(adminUser)
    const req = new NextRequest(new Request('http://localhost/api/admin/jobs', { method: 'PATCH', body: '{}' }))
    const res = await jobsPATCH(req)
    expect(res.status).toBe(400)
  })

  it('updates jobs via service on PATCH', async () => {
    ;(requireAdminUser as vi.Mock).mockResolvedValue(adminUser)
    ;(updateJobs as vi.Mock).mockResolvedValue([{ id: 'job-1', status: 'OPEN' }])

    const req = new NextRequest(
      new Request('http://localhost/api/admin/jobs', {
        method: 'PATCH',
        body: JSON.stringify({ jobIds: ['job-1'], action: 'approve', reason: 'looks good' }),
      }),
    )
    const res = await jobsPATCH(req)
    const data = await res.json()

    expect(updateJobs).toHaveBeenCalledWith({
      adminId: 'admin-1',
      ids: ['job-1'],
      action: 'approve',
      reason: 'looks good',
    })
    expect(res.status).toBe(200)
    expect(data).toMatchObject({ success: true })
  })
})

describe('admin employers API', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('short-circuits with guard response on GET', async () => {
    ;(requireAdminUser as vi.Mock).mockImplementation(() => {
      throw NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    })

    const req = new NextRequest(new Request('http://localhost/api/admin/employers'))
    const res = await employersGET(req)
    expect(res.status).toBe(403)
  })

  it('returns paginated employers on GET', async () => {
    ;(requireAdminUser as vi.Mock).mockResolvedValue(adminUser)
    ;(listEmployers as vi.Mock).mockResolvedValue({ employers: [{ id: 'emp-1' }], total: 1 })

    const req = new NextRequest(
      new Request('http://localhost/api/admin/employers?q=corp&page=3&pageSize=20&status=verified'),
    )
    const res = await employersGET(req)
    const data = await res.json()

    expect(listEmployers).toHaveBeenCalledWith({
      search: 'corp',
      status: 'verified',
      page: 3,
      pageSize: 20,
    })
    expect(data).toMatchObject({ employers: [{ id: 'emp-1' }], total: 1, page: 3, pageSize: 20 })
  })

  it('rejects invalid PATCH payloads', async () => {
    ;(requireAdminUser as vi.Mock).mockResolvedValue(adminUser)
    const req = new NextRequest(
      new Request('http://localhost/api/admin/employers', { method: 'PATCH', body: '{}' }),
    )
    const res = await employersPATCH(req)
    expect(res.status).toBe(400)
  })

  it('updates employers via service on PATCH', async () => {
    ;(requireAdminUser as vi.Mock).mockResolvedValue(adminUser)
    ;(updateEmployers as vi.Mock).mockResolvedValue([{ id: 'emp-1', isVerified: true }])

    const req = new NextRequest(
      new Request('http://localhost/api/admin/employers', {
        method: 'PATCH',
        body: JSON.stringify({ employerProfileId: 'emp-1', action: 'verify', reason: 'docs ok' }),
      }),
    )
    const res = await employersPATCH(req)
    const data = await res.json()

    expect(updateEmployers).toHaveBeenCalledWith({
      adminId: 'admin-1',
      ids: ['emp-1'],
      action: 'verify',
      reason: 'docs ok',
    })
    expect(res.status).toBe(200)
    expect(data).toMatchObject({ success: true })
  })
})
