import { SigmaValidator } from './base.js'
import type { SigmaValidationIssue } from './base.js'
import type { SigmaRule } from '../rule.js'

export class LevelExistsValidator extends SigmaValidator {
  validate(rule: SigmaRule): SigmaValidationIssue[] {
    if (rule.level === undefined) {
      return [{ severity: 'warning', message: 'Rule should have a "level" field', rule }]
    }
    return []
  }
}
