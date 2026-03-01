import { SigmaModifier } from './base.js'
import type { SigmaType } from '../types/index.js'
import { SigmaString } from '../types/sigma-string.js'
import type { SigmaStringPart } from '../types/sigma-string.js'

export class WindashModifier extends SigmaModifier {
  static override readonly modifierName = 'windash'

  apply(values: readonly SigmaType[]): SigmaType[] {
    const results: SigmaType[] = []
    for (const v of values) {
      results.push(v)
      if (!(v instanceof SigmaString)) continue
      const str = v.plain_value()
      if (str.includes('-')) {
        // Add variant with / instead of -
        const newParts: SigmaStringPart[] = v.parts.map((p) => {
          if (p.kind === 'plain') {
            return { kind: 'plain', value: p.value.replace(/-/g, '/') }
          }
          return p
        })
        results.push(SigmaString.fromParts(newParts))
      }
    }
    return results
  }
}
