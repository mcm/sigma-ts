import type { SigmaRule } from '../../rule.js'
import type { SigmaDetectionItem } from '../../detection.js'
import { ProcessingCondition } from './base.js'
import type { PipelineState } from './base.js'

export class RuleProcessingItemAppliedCondition extends ProcessingCondition {
  constructor(private readonly itemId: string) {
    super()
  }

  matchesRule(rule: SigmaRule, state: PipelineState): boolean {
    return rule.processingItemsApplied.has(this.itemId) || state.appliedItems.has(this.itemId)
  }

  matchesDetectionItem(_item: SigmaDetectionItem, _state: PipelineState): boolean {
    return false
  }
}
