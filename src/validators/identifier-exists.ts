import { SigmaValidator } from './base.js'
import type { SigmaValidationIssue } from './base.js'
import type { SigmaRule } from '../rule.js'

export class IdentifierExistsValidator extends SigmaValidator {
  validate(rule: SigmaRule): SigmaValidationIssue[] {
    if (rule.id === undefined || rule.id.trim().length === 0) {
      return [{ severity: 'error', message: 'Rule must have a non-empty "id" field', rule }]
    }
    return []
  }
}
