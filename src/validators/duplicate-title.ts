import { SigmaValidator } from './base.js'
import type { SigmaValidationIssue } from './base.js'
import type { SigmaRule } from '../rule.js'
import type { SigmaCollection } from '../collection.js'

export class DuplicateTitleValidator extends SigmaValidator {
  validate(rule: SigmaRule, collection?: SigmaCollection): SigmaValidationIssue[] {
    if (collection === undefined) return []
    const duplicates = [...collection].filter(r => r !== rule && r.title === rule.title)
    if (duplicates.length > 0) {
      return [{ severity: 'warning', message: `Duplicate rule title: "${rule.title}"`, rule }]
    }
    return []
  }
}
