import { SigmaValidator } from './base.js'
import type { SigmaValidationIssue } from './base.js'
import type { SigmaRule } from '../rule.js'

export class FalsePositivesExistsValidator extends SigmaValidator {
  validate(rule: SigmaRule): SigmaValidationIssue[] {
    if (rule.falsepositives.length === 0) {
      return [{ severity: 'informational', message: 'Rule should have a "falsepositives" entry', rule }]
    }
    return []
  }
}
