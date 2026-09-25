import { describe, it, expect } from 'vitest'
import { parseJobInput } from '@/lib/jobValidation'

const basePayload = {
  title: 'Senior Engineer',
  description: 'A great role building things',
  company: 'Example Co',
  location: 'Addis Ababa',
  tags: ['Tech', 'Engineering'],
  salary: '10000',
  jobType: 'FULL_TIME' as const,
}

describe('parseJobInput', () => {
  it('parses valid payload', () => {
    const parsed = parseJobInput(basePayload)
    expect(parsed.title).toBe(basePayload.title)
    expect(parsed.jobType).toBe('FULL_TIME')
  })

  it('rejects missing fields', () => {
    expect(() => parseJobInput({ ...basePayload, title: '' })).toThrow()
    expect(() => parseJobInput({ ...basePayload, description: 'short' })).toThrow()
  })

  it('rejects invalid jobType', () => {
    expect(() => parseJobInput({ ...basePayload, jobType: 'TEMP' as any })).toThrow()
  })
})
