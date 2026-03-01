import { SigmaValidator } from './base.js'
import type { SigmaValidationIssue } from './base.js'
import type { SigmaRule } from '../rule.js'

export class TitleLengthValidator extends SigmaValidator {
  private readonly maxLength: number

  constructor(maxLength = 110) {
    super()
    this.maxLength = maxLength
  }

  validate(rule: SigmaRule): SigmaValidationIssue[] {
    if (rule.title.length > this.maxLength) {
      return [{
        severity: 'warning',
        message: `Rule title exceeds ${this.maxLength} characters (${rule.title.length})`,
        rule,
      }]
    }
    return []
  }
}
