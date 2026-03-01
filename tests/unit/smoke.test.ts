import { describe, it, expect } from 'vitest'

describe('entry point smoke tests', () => {
  it('resolves src/index.ts', async () => {
    const mod = await import('../../src/index.ts')
    expect(mod).toBeDefined()
  })

  it('resolves src/core.ts', async () => {
    const mod = await import('../../src/core.ts')
    expect(mod).toBeDefined()
  })

  it('resolves src/node/index.ts', async () => {
    const mod = await import('../../src/node/index.ts')
    expect(mod).toBeDefined()
  })
})
