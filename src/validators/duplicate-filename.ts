import { SigmaValidator } from './base.js'
import type { SigmaValidationIssue } from './base.js'
import type { SigmaRule } from '../rule.js'
import type { SigmaCollection } from '../collection.js'

export class DuplicateFilenameValidator extends SigmaValidator {
  private filenameCounts: Map<string, number> | undefined

  validate(rule: SigmaRule, collection?: SigmaCollection): SigmaValidationIssue[] {
    const filename = rule.customAttributes.get('filename')
    if (typeof filename !== 'string' || collection === undefined) return []
    if (this.filenameCounts === undefined) {
      this.filenameCounts = new Map()
      for (const r of collection) {
        const f = r.customAttributes.get('filename')
        if (typeof f === 'string') {
          this.filenameCounts.set(f, (this.filenameCounts.get(f) ?? 0) + 1)
        }
      }
    }
    if ((this.filenameCounts.get(filename) ?? 0) > 1) {
      return [{ severity: 'warning', message: `Duplicate filename: "${filename}"`, rule }]
    }
    return []
  }
}
