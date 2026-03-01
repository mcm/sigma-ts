import type { SigmaRule } from '../rule.js'
import type { SigmaDetectionItem } from '../detection.js'

export type SigmaValidationSeverity = 'error' | 'warning' | 'informational'

export interface SigmaValidationIssue {
  readonly severity: SigmaValidationSeverity
  readonly message: string
  readonly rule: SigmaRule
  readonly detectionItem?: SigmaDetectionItem
}

export abstract class SigmaValidator {
  abstract validate(rule: SigmaRule, collection?: import('../collection.js').SigmaCollection): SigmaValidationIssue[]
}
