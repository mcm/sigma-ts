import { SigmaValidator } from './base.js'
import type { SigmaValidationIssue } from './base.js'
import type { SigmaRule } from '../rule.js'
import type { SigmaCollection } from '../collection.js'

export class DuplicateTitleValidator extends SigmaValidator {
  private titleCounts: Map<string, number> | undefined

  validate(rule: SigmaRule, collection?: SigmaCollection): SigmaValidationIssue[] {
    if (collection === undefined) return []
    if (this.titleCounts === undefined) {
      this.titleCounts = new Map()
      for (const r of collection) {
        this.titleCounts.set(r.title, (this.titleCounts.get(r.title) ?? 0) + 1)
      }
    }
    if ((this.titleCounts.get(rule.title) ?? 0) > 1) {
      return [{ severity: 'warning', message: `Duplicate rule title: "${rule.title}"`, rule }]
    }
    return []
  }
}
