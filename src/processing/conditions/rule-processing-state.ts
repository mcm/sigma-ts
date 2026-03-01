import type { SigmaRule } from '../../rule.js'
import type { SigmaDetectionItem } from '../../detection.js'
import { ProcessingCondition } from './base.js'
import type { PipelineState } from './base.js'

export class RuleProcessingStateCondition extends ProcessingCondition {
  constructor(
    private readonly key: string,
    private readonly value: unknown,
  ) {
    super()
  }

  matchesRule(_rule: SigmaRule, state: PipelineState): boolean {
    return state.customState.get(this.key) === this.value
  }

  matchesDetectionItem(_item: SigmaDetectionItem, _state: PipelineState): boolean {
    return false
  }
}
