import { SigmaValidator } from './base.js'
import type { SigmaValidationIssue } from './base.js'
import type { SigmaRule } from '../rule.js'

export class StatusExistsValidator extends SigmaValidator {
  validate(rule: SigmaRule): SigmaValidationIssue[] {
    if (rule.status === undefined) {
      return [{ severity: 'warning', message: 'Rule should have a "status" field', rule }]
    }
    return []
  }
}
