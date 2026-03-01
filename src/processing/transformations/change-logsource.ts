import { ProcessingTransformation } from './base.js'
import type { SigmaRule } from '../../rule.js'
import type { SigmaDetectionItem } from '../../detection.js'
import type { MutablePipelineState } from '../pipeline.js'
import { SigmaLogsource } from '../../logsource.js'

export class ChangeLogsourceTransformation extends ProcessingTransformation {
  private readonly logsource: SigmaLogsource

  constructor(params: { category?: string; product?: string; service?: string }) {
    super()
    this.logsource = new SigmaLogsource(params)
  }

  applyToRule(rule: SigmaRule, _state: MutablePipelineState): SigmaRule {
    return rule._clone({ logsource: this.logsource })
  }

  applyToDetectionItem(
    item: SigmaDetectionItem,
    _state: MutablePipelineState,
  ): SigmaDetectionItem[] {
    return [item]
  }
}
