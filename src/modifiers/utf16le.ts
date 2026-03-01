import { SigmaModifier } from './base.js'
import type { SigmaType } from '../types/index.js'
import { SigmaString } from '../types/sigma-string.js'

export class Utf16leModifier extends SigmaModifier {
  static override readonly modifierName = 'utf16le'

  apply(values: readonly SigmaType[]): SigmaType[] {
    return values.map((v) => {
      if (!(v instanceof SigmaString)) return v
      const plain = v.plain_value()
      const buf = Buffer.from(plain, 'utf16le')
      return SigmaString.plain(buf.toString('binary'))
    })
  }
}
