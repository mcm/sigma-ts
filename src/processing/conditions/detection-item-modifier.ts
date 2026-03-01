import type { SigmaRule } from '../../rule.js'
import type { SigmaDetectionItem } from '../../detection.js'
import { ProcessingCondition } from './base.js'
import type { PipelineState } from './base.js'

export class DetectionItemModifierCondition extends ProcessingCondition {
  constructor(private readonly modifier: string) {
    super()
  }

  matchesRule(_rule: SigmaRule, _state: PipelineState): boolean {
    return false
  }

  matchesDetectionItem(item: SigmaDetectionItem, _state: PipelineState): boolean {
    return item.modifiers.includes(this.modifier)
  }
}
