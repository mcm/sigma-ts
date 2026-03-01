import { SigmaConditionError } from './exceptions.js'
import { SigmaAggregationExpression as SigmaAggExpr } from './aggregation.js'
import type { AggregationFunction, ComparisonOperator } from './aggregation.js'
import type { SigmaAggregationExpression } from './aggregation.js'

/** Build error options, omitting token if undefined (required by exactOptionalPropertyTypes). */
function errOpts(token: string | undefined): { token?: string } {
  return token !== undefined ? { token } : {}
}

// ============================================================================
// Token types
// ============================================================================

type TokenKind =
  | 'IDENTIFIER'
  | 'NUMBER'
  | 'KEYWORD_AND'
  | 'KEYWORD_OR'
  | 'KEYWORD_NOT'
  | 'KEYWORD_OF'
  | 'KEYWORD_THEM'
  | 'KEYWORD_ALL'
  | 'KEYWORD_NEAR'
  | 'KEYWORD_BY'
  | 'PIPE'
  | 'LPAREN'
  | 'RPAREN'
  | 'GT'
  | 'GTE'
  | 'LT'
  | 'LTE'
  | 'EQ'
  | 'EOF'

interface Token {
  readonly kind: TokenKind
  readonly value: string
}

// ============================================================================
// Lexer
// ============================================================================

function tokenize(expr: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < expr.length) {
    const ch = expr[i]!

    // Skip whitespace
    if (/\s/.test(ch)) {
      i++
      continue
    }

    // Single-char tokens
    if (ch === '(') {
      tokens.push({ kind: 'LPAREN', value: '(' })
      i++
      continue
    }
    if (ch === ')') {
      tokens.push({ kind: 'RPAREN', value: ')' })
      i++
      continue
    }
    if (ch === '|') {
      tokens.push({ kind: 'PIPE', value: '|' })
      i++
      continue
    }
    if (ch === '=') {
      tokens.push({ kind: 'EQ', value: '=' })
      i++
      continue
    }

    // Multi-char comparison operators
    if (ch === '>' && expr[i + 1] === '=') {
      tokens.push({ kind: 'GTE', value: '>=' })
      i += 2
      continue
    }
    if (ch === '<' && expr[i + 1] === '=') {
      tokens.push({ kind: 'LTE', value: '<=' })
      i += 2
      continue
    }
    if (ch === '>') {
      tokens.push({ kind: 'GT', value: '>' })
      i++
      continue
    }
    if (ch === '<') {
      tokens.push({ kind: 'LT', value: '<' })
      i++
      continue
    }

    // Numbers
    if (/\d/.test(ch)) {
      let numStr = ''
      while (i < expr.length) {
        const c = expr[i]
        if (c === undefined || !/[\d.]/.test(c)) break
        numStr += c
        i++
      }
      tokens.push({ kind: 'NUMBER', value: numStr })
      continue
    }

    // Identifiers and keywords
    if (/[a-zA-Z_]/.test(ch)) {
      let word = ''
      while (i < expr.length) {
        const c = expr[i]
        if (c === undefined || !/[a-zA-Z0-9_*]/.test(c)) break
        word += c
        i++
      }
      const lower = word.toLowerCase()
      if (lower === 'and') tokens.push({ kind: 'KEYWORD_AND', value: word })
      else if (lower === 'or') tokens.push({ kind: 'KEYWORD_OR', value: word })
      else if (lower === 'not') tokens.push({ kind: 'KEYWORD_NOT', value: word })
      else if (lower === 'of') tokens.push({ kind: 'KEYWORD_OF', value: word })
      else if (lower === 'them') tokens.push({ kind: 'KEYWORD_THEM', value: word })
      else if (lower === 'all') tokens.push({ kind: 'KEYWORD_ALL', value: word })
      else if (lower === 'near') tokens.push({ kind: 'KEYWORD_NEAR', value: word })
      else if (lower === 'by') tokens.push({ kind: 'KEYWORD_BY', value: word })
      else tokens.push({ kind: 'IDENTIFIER', value: word })
      continue
    }

    throw new SigmaConditionError(`Unexpected character: "${ch}"`, { token: ch })
  }

  tokens.push({ kind: 'EOF', value: '' })
  return tokens
}

// ============================================================================
// AST Node types
// ============================================================================

export type ASTNode =
  | IdentifierNode
  | QuantifierNode
  | NotNode
  | AndNode
  | OrNode

export interface IdentifierNode {
  readonly kind: 'identifier'
  readonly name: string
}

export interface QuantifierNode {
  readonly kind: 'quantifier'
  readonly count: number | 'all'
  readonly pattern: string | 'them'
}

export interface NotNode {
  readonly kind: 'not'
  readonly operand: ASTNode
}

export interface AndNode {
  readonly kind: 'and'
  readonly left: ASTNode
  readonly right: ASTNode
}

export interface OrNode {
  readonly kind: 'or'
  readonly left: ASTNode
  readonly right: ASTNode
}

// ============================================================================
// Recursive-descent parser
// ============================================================================

class Parser {
  private pos = 0

  constructor(
    private readonly tokens: Token[],
    private readonly detectionNames: ReadonlySet<string>,
  ) {}

  private peek(): Token {
    const tok = this.tokens[this.pos]
    return tok ?? { kind: 'EOF', value: '' }
  }

  private consume(): Token {
    const tok = this.tokens[this.pos]
    if (tok === undefined) return { kind: 'EOF', value: '' }
    this.pos++
    return tok
  }

  private expect(kind: TokenKind): Token {
    const tok = this.peek()
    if (tok.kind !== kind) {
      throw new SigmaConditionError(
        `Expected ${kind} but got ${tok.kind} ("${tok.value}")`,
        { token: tok.value },
      )
    }
    return this.consume()
  }

  parseExpr(): ASTNode {
    return this.parseOr()
  }

  parseTopLevel(): ASTNode {
    const node = this.parseOr()
    const remaining = this.peek()
    if (remaining.kind !== 'EOF') {
      // Give a specific error for 'near' whether it appears at the start or after a primary
      if (remaining.kind === 'KEYWORD_NEAR') {
        throw new SigmaConditionError(
          "'near' is not supported — use Sigma Correlation Rules for temporal proximity detection",
          { token: 'near' },
        )
      }
      throw new SigmaConditionError(
        `Unexpected token "${remaining.value}" after condition expression`,
        { token: remaining.value },
      )
    }
    return node
  }

  // or: and (OR and)*
  private parseOr(): ASTNode {
    let left = this.parseAnd()
    while (this.peek().kind === 'KEYWORD_OR') {
      this.consume()
      const right = this.parseAnd()
      left = { kind: 'or', left, right }
    }
    return left
  }

  // and: not (AND not)*
  private parseAnd(): ASTNode {
    let left = this.parseNot()
    while (this.peek().kind === 'KEYWORD_AND') {
      this.consume()
      const right = this.parseNot()
      left = { kind: 'and', left, right }
    }
    return left
  }

  // not: NOT primary | primary
  private parseNot(): ASTNode {
    if (this.peek().kind === 'KEYWORD_NOT') {
      this.consume()
      const operand = this.parsePrimary()
      return { kind: 'not', operand }
    }
    return this.parsePrimary()
  }

  // primary: LPAREN expr RPAREN | quantifier | identifier | NEAR-error
  private parsePrimary(): ASTNode {
    const tok = this.peek()

    if (tok.kind === 'KEYWORD_NEAR') {
      throw new SigmaConditionError(
        "'near' is not supported — use Sigma Correlation Rules for temporal proximity detection",
        { token: 'near' },
      )
    }

    if (tok.kind === 'LPAREN') {
      this.consume()
      const expr = this.parseExpr()
      this.expect('RPAREN')
      return expr
    }

    // Quantifier: NUMBER OF pattern | ALL OF pattern
    if (tok.kind === 'NUMBER' || tok.kind === 'KEYWORD_ALL') {
      return this.parseQuantifier()
    }

    if (tok.kind === 'IDENTIFIER') {
      this.consume()
      // Validate identifier exists in detection names
      if (!this.detectionNames.has(tok.value)) {
        throw new SigmaConditionError(
          `Unknown detection identifier: "${tok.value}"`,
          { token: tok.value },
        )
      }
      return { kind: 'identifier', name: tok.value }
    }

    throw new SigmaConditionError(
      `Unexpected token "${tok.value}" in condition expression`,
      { token: tok.value },
    )
  }

  // quantifier: (NUMBER | ALL) OF (THEM | IDENTIFIER)
  private parseQuantifier(): QuantifierNode {
    const tok = this.consume()
    let count: number | 'all'

    if (tok.kind === 'KEYWORD_ALL') {
      count = 'all'
    } else if (tok.kind === 'NUMBER') {
      count = parseInt(tok.value, 10)
    } else {
      throw new SigmaConditionError(`Expected number or 'all' for quantifier`, { token: tok.value })
    }

    this.expect('KEYWORD_OF')

    const patternTok = this.peek()
    let pattern: string | 'them'

    if (patternTok.kind === 'KEYWORD_THEM') {
      this.consume()
      pattern = 'them'
    } else if (patternTok.kind === 'IDENTIFIER') {
      this.consume()
      pattern = patternTok.value
    } else if (patternTok.kind === 'KEYWORD_ALL') {
      // "all of all_*" - 'all' token as identifier start
      this.consume()
      pattern = patternTok.value
    } else {
      throw new SigmaConditionError(
        `Expected pattern or 'them' after 'of'`,
        { token: patternTok.value },
      )
    }

    // Validate that the pattern matches at least one detection (only for non-'them' patterns)
    if (pattern !== 'them') {
      const matched = matchPattern(pattern, this.detectionNames)
      if (matched.length === 0) {
        throw new SigmaConditionError(
          `Pattern "${pattern}" matches no detection definitions`,
          { token: pattern },
        )
      }
    }

    return { kind: 'quantifier', count, pattern }
  }
}

// ============================================================================
// Pattern matching for quantifiers
// ============================================================================

/**
 * Match a glob pattern (with * wildcard) against a set of names.
 */
export function matchPattern(pattern: string, names: ReadonlySet<string>): string[] {
  const regexStr = '^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'
  const regex = new RegExp(regexStr, 'i')
  return [...names].filter(name => regex.test(name))
}

// ============================================================================
// Aggregation expression parser
// ============================================================================

function parseAggregation(tokens: Token[], startPos: number): {
  agg: SigmaAggregationExpression
  pos: number
} {
  let pos = startPos

  // After |, expect: FUNCTION_NAME LPAREN [FIELD] RPAREN [BY FIELD] OPERATOR NUMBER
  const funcTok = tokens[pos]
  if (funcTok === undefined || funcTok.kind !== 'IDENTIFIER') {
    throw new SigmaConditionError('Expected aggregation function name after |', errOpts(funcTok?.value))
  }

  const funcName = funcTok.value.toLowerCase()
  const validFunctions: AggregationFunction[] = ['count', 'min', 'max', 'avg', 'sum']
  if (!validFunctions.includes(funcName as AggregationFunction)) {
    throw new SigmaConditionError(`Unknown aggregation function: "${funcName}"`, { token: funcName })
  }

  pos++

  // Expect (
  const lparenTok = tokens[pos]
  if (lparenTok?.kind !== 'LPAREN') {
    throw new SigmaConditionError('Expected "(" after aggregation function', errOpts(lparenTok?.value))
  }
  pos++

  // Optional field name
  let field: string | null = null
  const fieldTok = tokens[pos]
  if (fieldTok?.kind === 'IDENTIFIER') {
    field = fieldTok.value
    pos++
  }

  // Expect )
  const rparenTok = tokens[pos]
  if (rparenTok?.kind !== 'RPAREN') {
    throw new SigmaConditionError('Expected ")" after aggregation field', errOpts(rparenTok?.value))
  }
  pos++

  // Optional BY field
  let groupByField: string | null = null
  const byTok = tokens[pos]
  if (byTok?.kind === 'KEYWORD_BY') {
    pos++
    const byFieldTok = tokens[pos]
    if (byFieldTok?.kind !== 'IDENTIFIER') {
      throw new SigmaConditionError('Expected field name after "by"', errOpts(byFieldTok?.value))
    }
    groupByField = byFieldTok.value
    pos++
  }

  // Comparison operator
  const opTok = tokens[pos]
  let operator: ComparisonOperator
  if (opTok?.kind === 'GT') operator = '>'
  else if (opTok?.kind === 'GTE') operator = '>='
  else if (opTok?.kind === 'LT') operator = '<'
  else if (opTok?.kind === 'LTE') operator = '<='
  else if (opTok?.kind === 'EQ') operator = '='
  else throw new SigmaConditionError('Expected comparison operator in aggregation', errOpts(opTok?.value))
  pos++

  // Threshold number
  const numTok = tokens[pos]
  if (numTok?.kind !== 'NUMBER') {
    throw new SigmaConditionError('Expected threshold number in aggregation', errOpts(numTok?.value))
  }
  const threshold = parseFloat(numTok.value)
  pos++

  const agg = new SigmaAggExpr({
    function: funcName as AggregationFunction,
    field,
    groupByField,
    condition: { operator, threshold },
  })

  return { agg, pos }
}

// ============================================================================
// SigmaCondition
// ============================================================================

export class SigmaCondition {
  readonly expression: ASTNode
  readonly aggregation: SigmaAggregationExpression | null

  constructor(expression: ASTNode, aggregation: SigmaAggregationExpression | null = null) {
    this.expression = expression
    this.aggregation = aggregation
  }

  static parse(condExpr: string, detectionNames: ReadonlySet<string>): SigmaCondition {
    const tokens = tokenize(condExpr)

    // Split on PIPE for aggregation
    const pipeIdx = tokens.findIndex(t => t.kind === 'PIPE')

    let condTokens: Token[]
    let aggTokens: Token[]

    if (pipeIdx >= 0) {
      condTokens = [...tokens.slice(0, pipeIdx), { kind: 'EOF', value: '' }]
      aggTokens = tokens.slice(pipeIdx + 1)
    } else {
      condTokens = tokens
      aggTokens = []
    }

    // Parse condition expression
    const parser = new Parser(condTokens, detectionNames)
    const expression = parser.parseTopLevel()

    // Parse aggregation if present
    let aggregation: SigmaAggregationExpression | null = null
    if (aggTokens.length > 0) {
      const { agg } = parseAggregation(aggTokens, 0)
      aggregation = agg
    }

    return new SigmaCondition(expression, aggregation)
  }
}
