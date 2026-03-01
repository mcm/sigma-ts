import { SigmaModifier } from './base.js'
import type { SigmaType } from '../types/index.js'
import { SigmaNull } from '../types/sigma-null.js'
import { SigmaModifierError } from '../exceptions.js'

export class ExistsModifier extends SigmaModifier {
  static override readonly modifierName = 'exists'

  apply(values: readonly SigmaType[]): SigmaType[] {
    // The exists modifier expects values to be true/false booleans
    // In practice, this is handled at the detection item level
    // Return a SigmaNull to signal field existence check
    if (values.length !== 1) {
      throw new SigmaModifierError('exists modifier requires exactly one value (true or false)')
    }
    return [SigmaNull.getInstance()]
  }
}
