import type { SigmaRule } from '../../rule.js'
import type { SigmaDetectionItem } from '../../detection.js'
import { ProcessingCondition } from './base.js'
import type { PipelineState } from './base.js'
import { SigmaLogsource } from '../../logsource.js'

export class LogsourceCondition extends ProcessingCondition {
  private readonly logsource: SigmaLogsource

  constructor(params: { category?: string; product?: string; service?: string }) {
    super()
    this.logsource = new SigmaLogsource(params)
  }

  matchesRule(rule: SigmaRule, _state: PipelineState): boolean {
    return this.logsource.matches(rule.logsource)
  }

  matchesDetectionItem(_item: SigmaDetectionItem, _state: PipelineState): boolean {
    return false
  }
}
