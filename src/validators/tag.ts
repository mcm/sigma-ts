import { SigmaValidator } from './base.js'
import type { SigmaValidationIssue } from './base.js'
import type { SigmaRule } from '../rule.js'

export class TagValidator extends SigmaValidator {
  validate(rule: SigmaRule): SigmaValidationIssue[] {
    const issues: SigmaValidationIssue[] = []
    for (const tag of rule.tags) {
      if (!tag.raw.includes('.') || tag.namespace.length === 0 || tag.name.length === 0) {
        issues.push({
          severity: 'error',
          message: `Tag "${tag.raw}" does not follow "namespace.value" format`,
          rule,
        })
      }
    }
    return issues
  }
}
