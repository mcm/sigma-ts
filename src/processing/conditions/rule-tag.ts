import type { SigmaRule } from '../../rule.js'
import type { SigmaDetectionItem } from '../../detection.js'
import { ProcessingCondition } from './base.js'
import type { PipelineState } from './base.js'

export class RuleTagCondition extends ProcessingCondition {
  constructor(private readonly tag: string) {
    super()
  }

  matchesRule(rule: SigmaRule, _state: PipelineState): boolean {
    return rule.tags.some(t => t.raw === this.tag || `${t.namespace}.${t.name}` === this.tag)
  }

  matchesDetectionItem(_item: SigmaDetectionItem, _state: PipelineState): boolean {
    return false
  }
}
