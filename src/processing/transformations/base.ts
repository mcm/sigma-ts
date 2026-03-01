import type { SigmaRule } from '../../rule.js'
import type { SigmaDetectionItem } from '../../detection.js'
import type { MutablePipelineState } from '../pipeline.js'

export abstract class ProcessingTransformation {
  abstract applyToRule(rule: SigmaRule, state: MutablePipelineState): SigmaRule
  abstract applyToDetectionItem(
    item: SigmaDetectionItem,
    state: MutablePipelineState,
  ): SigmaDetectionItem[]
}
