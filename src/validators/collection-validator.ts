import type { SigmaCollection } from '../collection.js'
import type { SigmaValidationIssue } from './base.js'
import type { SigmaValidator } from './base.js'

export class SigmaCollectionValidator {
  private readonly validators: readonly SigmaValidator[]

  constructor(validators: SigmaValidator[]) {
    this.validators = validators
  }

  validate(collection: SigmaCollection): SigmaValidationIssue[] {
    const issues: SigmaValidationIssue[] = []
    for (const rule of collection) {
      for (const validator of this.validators) {
        issues.push(...validator.validate(rule, collection))
      }
    }
    return issues
  }
}
