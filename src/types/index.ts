import { SigmaString } from './sigma-string.js'
import type { SigmaStringPart } from './sigma-string.js'
import { SigmaNumber } from './sigma-number.js'
import { SigmaBool } from './sigma-bool.js'
import { SigmaNull } from './sigma-null.js'
import { SigmaRegularExpression } from './sigma-regex.js'
import { SigmaCIDRExpression } from './sigma-cidr.js'
import { SigmaQueryExpression } from './sigma-query-expression.js'
import { SigmaExpansion } from './sigma-expansion.js'
import { SigmaFieldReference } from './sigma-field-reference.js'

export {
  SigmaString,
  SigmaNumber,
  SigmaBool,
  SigmaNull,
  SigmaRegularExpression,
  SigmaCIDRExpression,
  SigmaQueryExpression,
  SigmaExpansion,
  SigmaFieldReference,
}
export type { SigmaStringPart }

export type SigmaType =
  | SigmaString
  | SigmaNumber
  | SigmaBool
  | SigmaNull
  | SigmaRegularExpression
  | SigmaCIDRExpression
  | SigmaQueryExpression
  | SigmaExpansion
  | SigmaFieldReference
