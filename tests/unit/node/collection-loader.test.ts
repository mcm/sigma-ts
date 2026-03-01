import { describe, it, expect } from 'vitest'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadRulesFromDirectory } from '../../../src/node/collection-loader.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const CORPUS_DIR = join(__dirname, '../../fixtures/corpus')
const BAD_CORPUS_DIR = join(__dirname, '../../fixtures/bad-corpus')

describe('loadRulesFromDirectory', () => {
  it('loads rules from a directory', async () => {
    const collection = await loadRulesFromDirectory(CORPUS_DIR)
    expect(collection.count).toBeGreaterThan(0)
    expect(collection.errorCount).toBe(0)
  })

  it('attaches filename to each rule', async () => {
    const collection = await loadRulesFromDirectory(CORPUS_DIR)
    for (const rule of collection) {
      const filename = rule.customAttributes.get('filename')
      expect(typeof filename).toBe('string')
    }
  })

  it('collects errors by default (errorHandling: collect)', async () => {
    const collection = await loadRulesFromDirectory(BAD_CORPUS_DIR)
    expect(collection.errorCount).toBeGreaterThan(0)
    expect(collection.count).toBeGreaterThan(0) // good.yml still loads
  })

  it('throws on first error when errorHandling: throw', async () => {
    await expect(
      loadRulesFromDirectory(BAD_CORPUS_DIR, { errorHandling: 'throw' }),
    ).rejects.toThrow()
  })

  it('loads more rules with recursive: true (includes subdirectory)', async () => {
    const recursive = await loadRulesFromDirectory(CORPUS_DIR, { recursive: true })
    const nonRecursive = await loadRulesFromDirectory(CORPUS_DIR, { recursive: false })
    // The corpus has a subdir with an extra rule
    expect(recursive.count).toBeGreaterThan(nonRecursive.count)
  })

  it('respects recursive: false (excludes subdirectory)', async () => {
    const collection = await loadRulesFromDirectory(CORPUS_DIR, { recursive: false })
    // Top-level files only
    expect(collection.count).toBeGreaterThan(0)
    // The rule in 'subdir' should NOT be included
    for (const rule of collection) {
      const filename = rule.customAttributes.get('filename') as string
      expect(filename).not.toContain('subdir')
    }
  })

  it('respects custom extensions filter', async () => {
    // Filter for .yaml only — corpus files use .yml, so should find nothing
    const collection = await loadRulesFromDirectory(CORPUS_DIR, { extensions: ['.yaml'] })
    expect(collection.count).toBe(0)
  })
})
