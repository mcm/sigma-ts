import { SigmaModifier } from './base.js'
import type { SigmaType } from '../types/index.js'
import { SigmaString } from '../types/sigma-string.js'

export class WideModifier extends SigmaModifier {
  static override readonly modifierName = 'wide'

  apply(values: readonly SigmaType[]): SigmaType[] {
    return values.map((v) => {
      if (!(v instanceof SigmaString)) return v
      const plain = v.plain_value()
      // UTF-16 LE: each char followed by null byte
      let result = ''
      for (let i = 0; i < plain.length; i++) {
        result += plain[i]
        result += '\x00'
      }
      return SigmaString.plain(result)
    })
  }
}
