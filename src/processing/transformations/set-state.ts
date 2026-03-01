import { ProcessingTransformation } from './base.js'
import type { SigmaRule } from '../../rule.js'
import type { SigmaDetectionItem } from '../../detection.js'
import type { MutablePipelineState } from '../pipeline.js'

export class SetStateTransformation extends ProcessingTransformation {
  constructor(
    private readonly key: string,
    private readonly value: unknown,
  ) {
    super()
  }

  applyToRule(rule: SigmaRule, state: MutablePipelineState): SigmaRule {
    state.customState.set(this.key, this.value)
    return rule
  }

  applyToDetectionItem(
    item: SigmaDetectionItem,
    _state: MutablePipelineState,
  ): SigmaDetectionItem[] {
    return [item]
  }
}
