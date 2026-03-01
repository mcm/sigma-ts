import { SigmaModifier } from './base.js'
import type { SigmaType } from '../types/index.js'
import { SigmaString } from '../types/sigma-string.js'

export class Utf16beModifier extends SigmaModifier {
  static override readonly modifierName = 'utf16be'

  apply(values: readonly SigmaType[]): SigmaType[] {
    return values.map((v) => {
      if (!(v instanceof SigmaString)) return v
      const plain = v.plain_value()
      // UTF-16 BE: null byte before each char
      let result = ''
      for (let i = 0; i < plain.length; i++) {
        result += '\x00'
        result += plain[i]
      }
      return SigmaString.plain(result)
    })
  }
}
