import { ProcessingTransformation } from './base.js'
import type { SigmaRule } from '../../rule.js'
import type { SigmaDetectionItem } from '../../detection.js'
import type { MutablePipelineState } from '../pipeline.js'

export class DropDetectionItemTransformation extends ProcessingTransformation {
  applyToRule(rule: SigmaRule, _state: MutablePipelineState): SigmaRule {
    return rule // Handled at item level via applyToDetectionItem
  }

  applyToDetectionItem(
    _item: SigmaDetectionItem,
    _state: MutablePipelineState,
  ): SigmaDetectionItem[] {
    return [] // Drop the item
  }
}
