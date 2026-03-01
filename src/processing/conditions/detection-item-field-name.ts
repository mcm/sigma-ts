import type { SigmaRule } from '../../rule.js'
import type { SigmaDetectionItem } from '../../detection.js'
import { ProcessingCondition } from './base.js'
import type { PipelineState } from './base.js'
import { globMatch } from '../../glob.js'

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
