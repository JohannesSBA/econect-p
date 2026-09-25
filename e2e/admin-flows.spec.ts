import { expect, test } from '@playwright/test'

const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost:3000'

test.describe('Admin job approval flow', () => {
  const adminState = process.env.E2E_ADMIN_STORAGE
  const jobId = process.env.E2E_JOB_ID
  test.skip(!adminState || !jobId, 'Requires E2E_ADMIN_STORAGE and E2E_JOB_ID env vars')
  test.use({ storageState: adminState })

  test('approves a pending job listing', async ({ request }) => {
    const res = await request.patch(`${baseUrl}/api/admin/jobs`, {
      data: { jobId, action: 'approve', reason: 'E2E approval' },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body?.success).toBe(true)
  })
})

test.describe('Admin employer verification flow', () => {
  const adminState = process.env.E2E_ADMIN_STORAGE
  const employerProfileId = process.env.E2E_EMPLOYER_PROFILE_ID
  test.skip(!adminState || !employerProfileId, 'Requires E2E_ADMIN_STORAGE and E2E_EMPLOYER_PROFILE_ID env vars')
  test.use({ storageState: adminState })

  test('verifies an employer profile', async ({ request }) => {
    const res = await request.patch(`${baseUrl}/api/admin/employers`, {
      data: { employerProfileId, action: 'verify', reason: 'E2E verification' },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body?.success).toBe(true)
  })
})

test.describe('Employer payment initiation flow', () => {
  const employerState = process.env.E2E_EMPLOYER_STORAGE
  const paymentJobId = process.env.E2E_PAYMENT_JOB_ID
  test.skip(!employerState || !paymentJobId, 'Requires E2E_EMPLOYER_STORAGE and E2E_PAYMENT_JOB_ID env vars')
  test.use({ storageState: employerState })

  test('starts a checkout session (uses discount to avoid live charge)', async ({ request }) => {
    const res = await request.post(`${baseUrl}/api/payments/chapa/checkout`, {
      data: { jobId: paymentJobId, amount: 500, discountCode: 'FREE' },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.paymentId).toBeTruthy()
    expect(body.discountApplied).toBe(true)
  })
})
