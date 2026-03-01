import { SigmaValidator } from './base.js'
import type { SigmaValidationIssue } from './base.js'
import type { SigmaRule } from '../rule.js'
import type { SigmaCollection } from '../collection.js'

export class DuplicateFilenameValidator extends SigmaValidator {
  validate(rule: SigmaRule, collection?: SigmaCollection): SigmaValidationIssue[] {
    const filename = rule.customAttributes.get('filename')
    if (typeof filename !== 'string' || collection === undefined) return []
    const duplicates = [...collection].filter(
      r => r !== rule && r.customAttributes.get('filename') === filename
    )
    if (duplicates.length > 0) {
      return [{ severity: 'warning', message: `Duplicate filename: "${filename}"`, rule }]
    }
    return []
  }
}
