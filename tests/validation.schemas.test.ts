import { describe, expect, it } from 'vitest'

import { fetchMessagesSchema, sendMessageSchema, threadQuerySchema } from '@/lib/validation/messages'
import { chapaCheckoutSchema, chapaConfirmSchema, paymentStatusSchema } from '@/lib/validation/payments'
import { parseJobInput } from '@/lib/jobValidation'

describe('validation schemas: messages', () => {
  it('accepts rich message payloads with attachments', () => {
    const result = sendMessageSchema.safeParse({
      text: 'Hello world',
      chatId: 'chat-123',
      chatPartner: 'user-456',
      attachments: [
        { url: 'https://cdn.example.com/file.png', filename: 'file.png', mimeType: 'image/png', size: 10 },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid pagination and dates', () => {
    expect(fetchMessagesSchema.safeParse({ chatId: 'c', chatPartner: 'u', limit: 999 }).success).toBe(false)
    expect(fetchMessagesSchema.safeParse({ chatId: 'c', chatPartner: 'u', before: 'not-a-date' }).success).toBe(
      false,
    )
  })

  it('validates thread query userId', () => {
    expect(threadQuerySchema.safeParse({ userId: 'abc' }).success).toBe(true)
    expect(threadQuerySchema.safeParse({ userId: '' }).success).toBe(false)
  })
})

describe('validation schemas: payments', () => {
  it('accepts checkout payload with defaults', () => {
    const result = chapaCheckoutSchema.safeParse({ jobId: 'job-1', amount: '500', currency: 'ETB' })
    expect(result.success).toBe(true)
    expect(result.data?.amount).toBe(500)
  })

  it('rejects bad checkout payloads', () => {
    expect(chapaCheckoutSchema.safeParse({ jobId: '', amount: -10 }).success).toBe(false)
    expect(chapaCheckoutSchema.safeParse({}).success).toBe(false)
  })

  it('requires payment id for confirm/status', () => {
    expect(chapaConfirmSchema.safeParse({ paymentId: 'p1' }).success).toBe(true)
    expect(paymentStatusSchema.safeParse({ paymentId: 'p1' }).success).toBe(true)
    expect(chapaConfirmSchema.safeParse({}).success).toBe(false)
  })
})

describe('validation schemas: jobs', () => {
  const basePayload = {
    title: 'Senior Engineer',
    description: 'A great role building things',
    company: 'Example Co',
    location: 'Addis Ababa',
    tags: ['Tech', 'Engineering'],
    salary: '10000',
    jobType: 'FULL_TIME' as const,
  }

  it('parses valid payload', () => {
    const parsed = parseJobInput(basePayload)
    expect(parsed.title).toBe(basePayload.title)
    expect(parsed.jobType).toBe('FULL_TIME')
  })

  it('allows optional fields to be omitted', () => {
    const parsed = parseJobInput({ ...basePayload, tags: undefined, salary: undefined })
    expect(parsed.tags).toBeUndefined()
    expect(parsed.salary).toBeUndefined()
  })

  it('rejects invalid job type or too-short content', () => {
    expect(() => parseJobInput({ ...basePayload, jobType: 'TEMP' as any })).toThrow()
    expect(() => parseJobInput({ ...basePayload, description: 'short' })).toThrow()
  })
})
