import { ProcessingTransformation } from './base.js'
import type { SigmaRule } from '../../rule.js'
import { SigmaDetectionItem, SigmaDetection } from '../../detection.js'
import type { MutablePipelineState } from '../pipeline.js'

export class AddConditionTransformation extends ProcessingTransformation {
  private readonly detectionItem: SigmaDetectionItem

  constructor(field: string, value: string | string[]) {
    super()
    const rawValue = Array.isArray(value) ? value : value
    this.detectionItem = SigmaDetectionItem.fromDict(field, rawValue)
  }

  applyToRule(rule: SigmaRule, _state: MutablePipelineState): SigmaRule {
    const newDetections = new Map(rule.detection.detections)
    const existing = newDetections.get('_added_condition')
    if (existing !== undefined) {
      const newItems = [...existing.detectionItems, this.detectionItem]
      newDetections.set('_added_condition', existing._clone(newItems))
    } else {
      newDetections.set('_added_condition', new SigmaDetection([this.detectionItem]))
    }
    return rule._clone({ detection: { ...rule.detection, detections: newDetections } })
  }

  applyToDetectionItem(
    item: SigmaDetectionItem,
    _state: MutablePipelineState,
  ): SigmaDetectionItem[] {
    return [item]
  }
}
