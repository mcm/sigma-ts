import type { SigmaRule } from '../../rule.js'
import type { SigmaDetectionItem } from '../../detection.js'
import { ProcessingCondition } from './base.js'
import type { PipelineState } from './base.js'
import type { SigmaType } from '../../types/index.js'

export class DetectionItemValueCondition extends ProcessingCondition {
  constructor(private readonly predicate: (value: SigmaType) => boolean) {
    super()
  }

  matchesRule(_rule: SigmaRule, _state: PipelineState): boolean {
    return false
  }

  matchesDetectionItem(item: SigmaDetectionItem, _state: PipelineState): boolean {
    return item.value.some(v => this.predicate(v))
  }
}
