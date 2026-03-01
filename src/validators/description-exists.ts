import { SigmaValidator } from './base.js'
import type { SigmaValidationIssue } from './base.js'
import type { SigmaRule } from '../rule.js'

export class DescriptionExistsValidator extends SigmaValidator {
  validate(rule: SigmaRule): SigmaValidationIssue[] {
    if (rule.description === undefined) {
      return [{ severity: 'informational', message: 'Rule should have a "description" field', rule }]
    }
    return []
  }
}
