import { SigmaModifier } from './base.js'
import type { SigmaType } from '../types/index.js'
import { SigmaString } from '../types/sigma-string.js'

export class Utf16Modifier extends SigmaModifier {
  static override readonly modifierName = 'utf16'

  apply(values: readonly SigmaType[]): SigmaType[] {
    return values.map((v) => {
      if (!(v instanceof SigmaString)) return v
      const plain = v.plain_value()
      // UTF-16 with BOM (default is LE with BOM \xFF\xFE)
      const buf = Buffer.from(plain, 'utf16le')
      const bom = Buffer.from([0xff, 0xfe])
      return SigmaString.plain(Buffer.concat([bom, buf]).toString('binary'))
    })
  }
}
