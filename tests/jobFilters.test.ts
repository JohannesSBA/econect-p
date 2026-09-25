import { describe, it, expect } from 'vitest'
import { publishedJobWhere } from '@/lib/jobFilters'
import { JobStatus, PaymentStatus } from '@/generated/prisma'

describe('publishedJobWhere', () => {
  it('requires open status and published flag', () => {
    expect(publishedJobWhere.status).toBe(JobStatus.OPEN)
    expect(publishedJobWhere.isPublished).toBe(true)
  })

  it('requires paid payment and verified employer/admin', () => {
    const payments = (publishedJobWhere as any).payments
    expect(payments.some.status).toBe(PaymentStatus.PAID)
    const andClause = (publishedJobWhere as any).AND?.[0]
    expect(andClause.OR.length).toBeGreaterThan(0)
  })
})
