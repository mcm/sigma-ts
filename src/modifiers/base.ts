import type { SigmaType } from '../types/index.js'

export abstract class SigmaModifier {
  static readonly modifierName: string = ''

  /**
   * Apply this modifier to the given values, returning new values.
   */
  abstract apply(values: readonly SigmaType[]): SigmaType[]

  /**
   * Whether this modifier changes value-linking from OR to AND.
   * Only the 'all' modifier returns true.
   */
  get changesValueLinking(): boolean {
    return false
  }

  /**
   * Whether this modifier is a "type conversion" modifier that prevents
   * further value-content modifiers from being applied.
   */
  get isTypeConversion(): boolean {
    return false
  }
}
