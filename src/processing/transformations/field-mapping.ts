import { ProcessingTransformation } from './base.js'
import type { SigmaRule } from '../../rule.js'
import { SigmaDetectionItem } from '../../detection.js'
import type { MutablePipelineState } from '../pipeline.js'

export class FieldMappingTransformation extends ProcessingTransformation {
  private readonly mapping: ReadonlyMap<string, readonly string[]>

  constructor(mapping: Record<string, string | string[]>) {
    super()
    this.mapping = new Map(
      Object.entries(mapping).map(([k, v]) => [k, Array.isArray(v) ? v : [v]]),
    )
  }

  applyToRule(rule: SigmaRule, _state: MutablePipelineState): SigmaRule {
    // Detection-item-level application is handled by the pipeline's item loop.
    return rule
  }

  applyToDetectionItem(
    item: SigmaDetectionItem,
    _state: MutablePipelineState,
  ): SigmaDetectionItem[] {
    if (item.field === null) return [item]
    const targets = this.mapping.get(item.field)
    if (targets === undefined) return [item]
    if (targets.length === 0) return []
    // Fan out: one item per target field
    return targets.map((target) => item._clone({ field: target }))
  }
}
