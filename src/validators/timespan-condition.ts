import { SigmaValidator } from './base.js'
import type { SigmaValidationIssue } from './base.js'
import type { SigmaRule } from '../rule.js'

export class TimespanConditionValidator extends SigmaValidator {
  validate(rule: SigmaRule): SigmaValidationIssue[] {
    if (rule.detection.timeframe === undefined) return []
    const hasAggregation = rule.detection.condition.some(c => c.aggregation !== null)
    if (!hasAggregation) {
      return [{
        severity: 'error',
        message: 'Rule has a "timeframe" but no condition with an aggregation expression',
        rule,
      }]
    }
    return []
  }
}
