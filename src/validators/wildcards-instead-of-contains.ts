import { SigmaValidator } from './base.js'
import type { SigmaValidationIssue } from './base.js'
import type { SigmaRule } from '../rule.js'
import { SigmaString } from '../types/sigma-string.js'

export class WildcardsInsteadOfContainsValidator extends SigmaValidator {
  validate(rule: SigmaRule): SigmaValidationIssue[] {
    const issues: SigmaValidationIssue[] = []
    for (const [, detection] of rule.detection.detections) {
      for (const item of detection.detectionItems) {
        if (item.modifiers.includes('contains')) continue
        for (const value of item.value) {
          if (!(value instanceof SigmaString)) continue
          const parts = value.parts
          if (
            parts.length >= 3 &&
            parts[0]?.kind === 'wildcard' &&
            parts[parts.length - 1]?.kind === 'wildcard'
          ) {
            issues.push({
              severity: 'warning',
              message: 'Value starts and ends with wildcards — consider using the "contains" modifier instead',
              rule,
              detectionItem: item,
            })
            break
          }
        }
      }
    }
    return issues
  }
}
