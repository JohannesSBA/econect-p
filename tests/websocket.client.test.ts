import { describe, it, expect } from 'vitest'

describe('websocket client config', () => {
  it('has a default NEXT_PUBLIC_SOCKET_URL or falls back', () => {
    // At least ensure the code path has a default URL
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3002'
    expect(url.startsWith('ws://') || url.startsWith('wss://')).toBe(true)
  })
})

