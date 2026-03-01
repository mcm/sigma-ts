import { ProcessingTransformation } from './base.js'
import type { SigmaRule } from '../../rule.js'
import { SigmaDetectionItem } from '../../detection.js'
import type { MutablePipelineState } from '../pipeline.js'
import { SigmaString } from '../../types/sigma-string.js'
import type { SigmaType } from '../../types/index.js'
import { SigmaTransformationError } from '../../exceptions.js'

/** Maximum regex pattern length accepted by ReplaceStringTransformation. */
const MAX_PATTERN_LENGTH = 2000

export class ReplaceStringTransformation extends ProcessingTransformation {
  private readonly regex: RegExp

  constructor(
    pattern: string,
    private readonly replacement: string,
  ) {
    super()
    if (pattern.length > MAX_PATTERN_LENGTH) {
      throw new SigmaTransformationError(
        `replace_string pattern exceeds maximum length of ${MAX_PATTERN_LENGTH} characters`,
      )
    }
    this.regex = new RegExp(pattern, 'g')
  }

  applyToRule(rule: SigmaRule, _state: MutablePipelineState): SigmaRule {
    const newDetections = new Map(rule.detection.detections)
    let changed = false
    for (const [name, detection] of newDetections) {
      const newItems = detection.detectionItems.map((item) => {
        const newValues: SigmaType[] = item.value.map((v) => {
          if (!(v instanceof SigmaString)) return v
          const newStr = v.plain_value().replace(this.regex, this.replacement)
          if (newStr === v.plain_value()) return v
          return SigmaString.plain(newStr)
        })
        if (newValues.every((v, i) => v === item.value[i])) return item
        return item._clone({ value: newValues })
      })
      if (newItems.some((it, i) => it !== detection.detectionItems[i])) {
        newDetections.set(name, detection._clone(newItems))
        changed = true
      }
    }
    if (!changed) return rule
    return rule._clone({ detection: { ...rule.detection, detections: newDetections } })
  }

  applyToDetectionItem(
    item: SigmaDetectionItem,
    _state: MutablePipelineState,
  ): SigmaDetectionItem[] {
    return [item]
  }
}
