import { ProcessingTransformation } from './base.js'
import type { SigmaRule } from '../../rule.js'
import type { SigmaDetectionItem } from '../../detection.js'
import type { MutablePipelineState } from '../pipeline.js'
import { SigmaLogsource } from '../../logsource.js'

export class ChangeLogsourceTransformation extends ProcessingTransformation {
  private readonly overrides: { category?: string; product?: string; service?: string }

  constructor(params: { category?: string; product?: string; service?: string }) {
    super()
    this.overrides = params
  }

  applyToRule(rule: SigmaRule, _state: MutablePipelineState): SigmaRule {
    const existing = rule.logsource
    const params: { category?: string; product?: string; service?: string; definition?: string; custom?: Record<string, string> } = {
      custom: { ...existing.custom },
    }
    const category = this.overrides.category ?? existing.category
    const product = this.overrides.product ?? existing.product
    const service = this.overrides.service ?? existing.service
    if (category !== undefined) params.category = category
    if (product !== undefined) params.product = product
    if (service !== undefined) params.service = service
    if (existing.definition !== undefined) params.definition = existing.definition
    return rule._clone({ logsource: new SigmaLogsource(params) })
  }

  applyToDetectionItem(
    item: SigmaDetectionItem,
    _state: MutablePipelineState,
  ): SigmaDetectionItem[] {
    return [item]
  }
}
