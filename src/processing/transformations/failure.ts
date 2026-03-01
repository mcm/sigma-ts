import { ProcessingTransformation } from './base.js'
import type { SigmaRule } from '../../rule.js'
import type { SigmaDetectionItem } from '../../detection.js'
import { SigmaTransformationError } from '../../exceptions.js'
import type { MutablePipelineState } from '../pipeline.js'

export class RuleFailureTransformation extends ProcessingTransformation {
  constructor(private readonly message: string) {
    super()
  }

  applyToRule(rule: SigmaRule, _state: MutablePipelineState): SigmaRule {
    throw new SigmaTransformationError(this.message, { source: rule.title })
  }

  applyToDetectionItem(
    item: SigmaDetectionItem,
    _state: MutablePipelineState,
  ): SigmaDetectionItem[] {
    return [item]
  }
}

export class DetectionItemFailureTransformation extends ProcessingTransformation {
  constructor(private readonly message: string) {
    super()
  }

  applyToRule(rule: SigmaRule, _state: MutablePipelineState): SigmaRule {
    return rule // Handled at item level
  }

  applyToDetectionItem(
    _item: SigmaDetectionItem,
    _state: MutablePipelineState,
  ): SigmaDetectionItem[] {
    throw new SigmaTransformationError(this.message)
  }
}
