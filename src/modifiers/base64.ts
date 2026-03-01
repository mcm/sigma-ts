import { SigmaModifier } from './base.js'
import type { SigmaType } from '../types/index.js'
import { SigmaString } from '../types/sigma-string.js'

export class Base64Modifier extends SigmaModifier {
  static override readonly modifierName = 'base64'

  apply(values: readonly SigmaType[]): SigmaType[] {
    return values.map((v) => {
      if (!(v instanceof SigmaString)) return v
      const plain = v.plain_value()
      const encoded = Buffer.from(plain, 'utf8').toString('base64')
      return SigmaString.plain(encoded)
    })
  }
}
