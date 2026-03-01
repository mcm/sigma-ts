import type { SigmaRule } from '../../rule.js'
import type { SigmaDetectionItem } from '../../detection.js'
import { ProcessingCondition } from './base.js'
import type { PipelineState } from './base.js'

export class DetectionItemProcessingItemAppliedCondition extends ProcessingCondition {
  constructor(private readonly itemId: string) {
    super()
  }

  matchesRule(_rule: SigmaRule, _state: PipelineState): boolean {
    return false
  }

  matchesDetectionItem(_item: SigmaDetectionItem, state: PipelineState): boolean {
    return state.appliedItems.has(this.itemId)
  }
}
