import { ProcessingTransformation } from './base.js'
import type { SigmaRule } from '../../rule.js'
import { SigmaDetectionItem } from '../../detection.js'
import type { MutablePipelineState } from '../pipeline.js'

export class AddFieldnamePrefixTransformation extends ProcessingTransformation {
  constructor(private readonly prefix: string) {
    super()
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
    return [item._clone({ field: this.prefix + item.field })]
  }
}

export class AddFieldnameSuffixTransformation extends ProcessingTransformation {
  constructor(private readonly suffix: string) {
    super()
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
    return [item._clone({ field: item.field + this.suffix })]
  }
}

export class FieldPrefixMappingTransformation extends ProcessingTransformation {
  private readonly mapping: ReadonlyMap<string, string>

  constructor(mapping: Record<string, string>) {
    super()
    this.mapping = new Map(Object.entries(mapping))
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
    for (const [prefix, replacement] of this.mapping) {
      if (item.field.startsWith(prefix)) {
        return [item._clone({ field: replacement + item.field.slice(prefix.length) })]
      }
    }
    return [item]
  }
}
