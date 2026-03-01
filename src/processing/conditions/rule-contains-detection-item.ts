import type { SigmaRule } from '../../rule.js'
import type { SigmaDetectionItem } from '../../detection.js'
import { ProcessingCondition } from './base.js'
import type { PipelineState } from './base.js'

export class RuleContainsDetectionItemCondition extends ProcessingCondition {
  constructor(
    private readonly subConditions: readonly ProcessingCondition[],
  ) {
    super()
  }

  matchesRule(rule: SigmaRule, state: PipelineState): boolean {
    for (const [, detection] of rule.detection.detections) {
      for (const item of detection.detectionItems) {
        if (this.subConditions.every(c => c.matchesDetectionItem(item, state))) {
          return true
        }
      }
    }
    return false
  }

  matchesDetectionItem(_item: SigmaDetectionItem, _state: PipelineState): boolean {
    return false
  }
}
