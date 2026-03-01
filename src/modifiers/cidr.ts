import { SigmaModifier } from './base.js'
import type { SigmaType } from '../types/index.js'
import { SigmaString } from '../types/sigma-string.js'
import { SigmaCIDRExpression } from '../types/sigma-cidr.js'

export class CidrModifier extends SigmaModifier {
  static override readonly modifierName = 'cidr'
  override get isTypeConversion(): boolean {
    return true
  }

  apply(values: readonly SigmaType[]): SigmaType[] {
    return values.map((v) => {
      if (!(v instanceof SigmaString)) return v
      return new SigmaCIDRExpression(v.plain_value())
    })
  }
}
