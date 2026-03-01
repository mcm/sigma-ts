import { ProcessingTransformation } from './base.js'
import type { SigmaRule } from '../../rule.js'
import type { SigmaDetectionItem } from '../../detection.js'
import type { MutablePipelineState } from '../pipeline.js'

export class SetCustomAttributeTransformation extends ProcessingTransformation {
  constructor(
    private readonly key: string,
    private readonly value: unknown,
  ) {
    super()
  }

  applyToRule(rule: SigmaRule, _state: MutablePipelineState): SigmaRule {
    const newAttrs = new Map(rule.customAttributes)
    newAttrs.set(this.key, this.value)
    return rule._clone({ customAttributes: newAttrs })
  }

  applyToDetectionItem(
    item: SigmaDetectionItem,
    _state: MutablePipelineState,
  ): SigmaDetectionItem[] {
    return [item]
  }
}
