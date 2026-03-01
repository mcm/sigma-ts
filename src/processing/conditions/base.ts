import type { SigmaRule } from '../../rule.js'
import type { SigmaDetectionItem } from '../../detection.js'

export interface PipelineState {
  readonly appliedItems: ReadonlySet<string>
  readonly customState: ReadonlyMap<string, unknown>
}

export abstract class ProcessingCondition {
  abstract matchesRule(rule: SigmaRule, state: PipelineState): boolean
  abstract matchesDetectionItem(item: SigmaDetectionItem, state: PipelineState): boolean
}
