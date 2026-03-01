import * as yaml from 'js-yaml'
import { SigmaError, SigmaRuleParseError } from './exceptions.js'
import { SigmaRule } from './rule.js'
import type { SigmaLevel, SigmaStatus } from './rule.js'
import { SigmaLogsource } from './logsource.js'

export interface CollectionError {
  readonly source: string
  readonly error: SigmaError
}

export class SigmaCollection {
  readonly rules: readonly SigmaRule[]
  readonly errors: readonly CollectionError[]

  constructor(rules: readonly SigmaRule[], errors: readonly CollectionError[] = []) {
    this.rules = rules
    this.errors = errors
  }

  get count(): number {
    return this.rules.length
  }

  get errorCount(): number {
    return this.errors.length
  }

  [Symbol.iterator](): Iterator<SigmaRule> {
    return this.rules[Symbol.iterator]()
  }

  get(index: number): SigmaRule {
    const rule = this.rules[index]
    if (rule === undefined) {
      throw new RangeError(`Index ${index} out of bounds (collection has ${this.rules.length} rules)`)
    }
    return rule
  }

  filter(predicate: (rule: SigmaRule) => boolean): SigmaCollection {
    return new SigmaCollection(this.rules.filter(predicate), this.errors)
  }

  filterByLogsource(logsource: Partial<SigmaLogsource>): SigmaCollection {
    const params: {
      category?: string
      product?: string
      service?: string
    } = {}
    if (logsource.category !== undefined) params.category = logsource.category
    if (logsource.product !== undefined) params.product = logsource.product
    if (logsource.service !== undefined) params.service = logsource.service

    const condition = new SigmaLogsource(params)
    return this.filter(rule => condition.matches(rule.logsource))
  }

  filterByTag(tag: string): SigmaCollection {
    return this.filter(rule => rule.tags.some(t => t.raw === tag || t.name === tag))
  }

  filterByStatus(status: SigmaStatus): SigmaCollection {
    return this.filter(rule => rule.status === status)
  }

  filterByLevel(level: SigmaLevel): SigmaCollection {
    return this.filter(rule => rule.level === level)
  }

  /**
   * Apply a processing pipeline to all rules.
   * Delegates to pipeline.applyCollection(this) — implemented in Story 11.
   */
  applyPipeline(pipeline: { applyCollection(collection: SigmaCollection): SigmaCollection }): SigmaCollection {
    return pipeline.applyCollection(this)
  }

  /**
   * Load rules from a multi-document YAML stream (--- separated).
   */
  static fromYAML(yamlStr: string): SigmaCollection {
    const rules: SigmaRule[] = []
    const errors: CollectionError[] = []

    const documents: unknown[] = []
    try {
      yaml.loadAll(yamlStr, (doc) => documents.push(doc))
    } catch (e) {
      // If YAML parsing fails entirely, return one error
      const err = new SigmaRuleParseError('Failed to parse YAML stream', { cause: e })
      errors.push({ source: 'yaml-stream', error: err })
      return new SigmaCollection(rules, errors)
    }

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i]
      if (doc === null || doc === undefined) continue
      if (typeof doc !== 'object' || Array.isArray(doc)) {
        const err = new SigmaRuleParseError(`Document ${i} is not an object`)
        errors.push({ source: `document-${i}`, error: err })
        continue
      }
      try {
        rules.push(SigmaRule.fromDict(doc as Record<string, unknown>))
      } catch (e) {
        const source =
          typeof (doc as Record<string, unknown>)['title'] === 'string'
            ? ((doc as Record<string, unknown>)['title'] as string)
            : `document-${i}`
        if (e instanceof SigmaError) {
          errors.push({ source, error: e })
        } else {
          errors.push({ source, error: new SigmaRuleParseError('Unknown parse error', { cause: e }) })
        }
      }
    }

    return new SigmaCollection(rules, errors)
  }

  /**
   * Load rules from a list of YAML strings, each containing a single rule.
   */
  static fromYAMLList(yamlList: readonly string[]): SigmaCollection {
    const rules: SigmaRule[] = []
    const errors: CollectionError[] = []

    for (let i = 0; i < yamlList.length; i++) {
      const yamlStr = yamlList[i]
      if (yamlStr === undefined) continue
      try {
        rules.push(SigmaRule.fromYAML(yamlStr))
      } catch (e) {
        if (e instanceof SigmaError) {
          errors.push({ source: `rule-${i}`, error: e })
        } else {
          errors.push({ source: `rule-${i}`, error: new SigmaRuleParseError('Unknown parse error', { cause: e }) })
        }
      }
    }

    return new SigmaCollection(rules, errors)
  }
}
