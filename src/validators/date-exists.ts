import { SigmaValidator } from './base.js'
import type { SigmaValidationIssue } from './base.js'
import type { SigmaRule } from '../rule.js'

export class DateExistsValidator extends SigmaValidator {
  validate(rule: SigmaRule): SigmaValidationIssue[] {
    if (rule.date === undefined) {
      return [{ severity: 'warning', message: 'Rule should have a "date" field', rule }]
    }
    return []
  }
}
