import { SigmaValidator } from './base.js'
import type { SigmaValidationIssue } from './base.js'
import type { SigmaRule } from '../rule.js'
import type { SigmaCollection } from '../collection.js'

export class IdentifierUniquenessValidator extends SigmaValidator {
  private idCounts: Map<string, number> | undefined

  validate(rule: SigmaRule, collection?: SigmaCollection): SigmaValidationIssue[] {
    if (rule.id === undefined || collection === undefined) return []
    if (this.idCounts === undefined) {
      this.idCounts = new Map()
      for (const r of collection) {
        if (r.id !== undefined) {
          this.idCounts.set(r.id, (this.idCounts.get(r.id) ?? 0) + 1)
        }
      }
    }
    if ((this.idCounts.get(rule.id) ?? 0) > 1) {
      return [{ severity: 'error', message: `Duplicate rule id: "${rule.id}"`, rule }]
    }
    return []
  }
}
