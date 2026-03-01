import type { SigmaRule } from '../../rule.js'
import type { SigmaDetectionItem } from '../../detection.js'
import { ProcessingCondition } from './base.js'
import type { PipelineState } from './base.js'

export class RuleContainsFieldCondition extends ProcessingCondition {
  constructor(private readonly fieldName: string) {
    super()
  }

  matchesRule(rule: SigmaRule, _state: PipelineState): boolean {
    for (const [, detection] of rule.detection.detections) {
      for (const item of detection.detectionItems) {
        if (item.field === this.fieldName) return true
      }
    }
    return false
  }

  matchesDetectionItem(_item: SigmaDetectionItem, _state: PipelineState): boolean {
    return false
  }
}
