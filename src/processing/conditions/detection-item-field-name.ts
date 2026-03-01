import type { SigmaRule } from '../../rule.js'
import type { SigmaDetectionItem } from '../../detection.js'
import { ProcessingCondition } from './base.js'
import type { PipelineState } from './base.js'

function globMatch(pattern: string, value: string): boolean {
  const regexStr =
    '^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'
  return new RegExp(regexStr).test(value)
}

export class DetectionItemFieldNameCondition extends ProcessingCondition {
  constructor(private readonly pattern: string) {
    super()
  }

  matchesRule(_rule: SigmaRule, _state: PipelineState): boolean {
    return false
  }

  matchesDetectionItem(item: SigmaDetectionItem, _state: PipelineState): boolean {
    if (item.field === null) return false
    return globMatch(this.pattern, item.field)
  }
}
