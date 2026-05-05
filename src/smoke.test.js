import { describe, expect, it } from 'vitest'

describe('smoke test', () => {
  it('runs in CI without empty suite', () => {
    expect(1 + 1).toBe(2)
  })
})
