import { describe, it, expect, beforeAll, afterAll } from 'vitest'

// Dynamically import after env is set
let getS3Url: (key: string) => string

describe('s3 url builder', () => {
  const prevEnv = { ...process.env }
  beforeAll(async () => {
    process.env.AWS_S3_BUCKET = 'my-bucket'
    process.env.AWS_REGION = 'us-east-1'
    const mod = await import('../src/lib/s3-upload')
    getS3Url = mod.getS3Url
  })
  afterAll(() => {
    process.env = prevEnv
  })

  it('builds https url with region and bucket', () => {
    const url = getS3Url('path/to/file.txt')
    expect(url).toBe('https://my-bucket.s3.us-east-1.amazonaws.com/path/to/file.txt')
  })
})

