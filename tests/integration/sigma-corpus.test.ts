import { describe, it, expect } from 'vitest'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadRulesFromDirectory } from '../../src/node/collection-loader.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const CORPUS_DIR = join(__dirname, '../fixtures/corpus')

describe('Sigma rule corpus', () => {
  it('loads all corpus fixtures without parse errors', async () => {
    const collection = await loadRulesFromDirectory(CORPUS_DIR)

    if (collection.errorCount > 0) {
      const messages = collection.errors.map(e => `${e.source}: ${e.error.message}`).join('\n')
      expect.fail(`Expected zero parse errors, got ${collection.errorCount}:\n${messages}`)
    }

    expect(collection.errorCount).toBe(0)
  })

  it('loads at least 20 corpus rules', async () => {
    const collection = await loadRulesFromDirectory(CORPUS_DIR)
    expect(collection.count).toBeGreaterThanOrEqual(20)
  })

  it('all corpus rules have a valid logsource', async () => {
    const collection = await loadRulesFromDirectory(CORPUS_DIR)
    for (const rule of collection) {
      const ls = rule.logsource
      const hasLogsource =
        ls.category !== undefined ||
        ls.product !== undefined ||
        ls.service !== undefined
      expect(
        hasLogsource,
        `Rule "${rule.title}" has no logsource (category/product/service)`,
      ).toBe(true)
    }
  })

  it('all corpus rules have at least one condition', async () => {
    const collection = await loadRulesFromDirectory(CORPUS_DIR)
    for (const rule of collection) {
      expect(
        rule.detection.condition.length,
        `Rule "${rule.title}" has no conditions`,
      ).toBeGreaterThan(0)
    }
  })

  it('all corpus rules have a title', async () => {
    const collection = await loadRulesFromDirectory(CORPUS_DIR)
    for (const rule of collection) {
      expect(rule.title.length, 'Rule has empty title').toBeGreaterThan(0)
    }
  })

  it('attaches source filename to each rule customAttributes', async () => {
    const collection = await loadRulesFromDirectory(CORPUS_DIR)
    for (const rule of collection) {
      const filename = rule.customAttributes.get('filename')
      expect(typeof filename, `Rule "${rule.title}" missing filename attribute`).toBe('string')
      expect((filename as string).endsWith('.yml') || (filename as string).endsWith('.yaml')).toBe(true)
    }
  })
})
