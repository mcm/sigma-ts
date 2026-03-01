import { SigmaModifier } from './base.js'
import type { SigmaType } from '../types/index.js'
import { SigmaString } from '../types/sigma-string.js'

export class Base64OffsetModifier extends SigmaModifier {
  static override readonly modifierName = 'base64offset'

  apply(values: readonly SigmaType[]): SigmaType[] {
    const results: SigmaType[] = []
    for (const v of values) {
      if (!(v instanceof SigmaString)) {
        results.push(v)
        continue
      }
      const plain = v.plain_value()
      // Produce 3 variants with 0, 1, 2 byte prefix padding to handle
      // base64 encoding at different byte boundaries
      for (let offset = 0; offset < 3; offset++) {
        const padded = '\x00'.repeat(offset) + plain
        const encoded = Buffer.from(padded, 'utf8').toString('base64')
        // Remove the padding prefix in the encoded form
        // Each 0 byte prefix produces leading 'A' chars (offset 1→1 char, offset 2→2 chars)
        const trimmed = encoded.slice(offset === 0 ? 0 : Math.ceil((offset * 4) / 3))
        results.push(SigmaString.plain(trimmed))
      }
    }
    return results
  }
}
