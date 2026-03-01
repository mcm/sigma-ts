import { SigmaValidator } from './base.js'
import type { SigmaValidationIssue } from './base.js'
import type { SigmaRule } from '../rule.js'
import type { SigmaCollection } from '../collection.js'

export class IdentifierUniquenessValidator extends SigmaValidator {
  validate(rule: SigmaRule, collection?: SigmaCollection): SigmaValidationIssue[] {
    if (rule.id === undefined || collection === undefined) return []
    const duplicates = [...collection].filter(r => r !== rule && r.id === rule.id)
    if (duplicates.length > 0) {
      return [{ severity: 'error', message: `Duplicate rule id: "${rule.id}"`, rule }]
    }
    return []
  }
}
