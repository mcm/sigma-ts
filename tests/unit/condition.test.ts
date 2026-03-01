import { describe, it, expect } from 'vitest'
import { SigmaCondition } from '../../src/condition.ts'
import { SigmaConditionError } from '../../src/exceptions.ts'

const detectionNames = new Set(['selection', 'filter', 'selection_main', 'selection_other'])

describe('SigmaCondition.parse()', () => {
  it('parses single identifier', () => {
    const cond = SigmaCondition.parse('selection', detectionNames)
    expect(cond.expression).toEqual({ kind: 'identifier', name: 'selection' })
    expect(cond.aggregation).toBeNull()
  })

  it('parses AND expression', () => {
    const cond = SigmaCondition.parse('selection and filter', detectionNames)
    expect(cond.expression.kind).toBe('and')
  })

  it('parses OR expression', () => {
    const cond = SigmaCondition.parse('selection or filter', detectionNames)
    expect(cond.expression.kind).toBe('or')
  })

  it('parses NOT expression', () => {
    const cond = SigmaCondition.parse('not filter', detectionNames)
    expect(cond.expression.kind).toBe('not')
  })

  it('parses AND/OR with correct precedence (and binds tighter)', () => {
    // a or b and c  ==  a or (b and c)
    const cond = SigmaCondition.parse('selection or filter and selection_main', detectionNames)
    expect(cond.expression.kind).toBe('or')
  })

  it('parses grouped expression with parentheses', () => {
    const cond = SigmaCondition.parse('(selection or filter) and selection_main', detectionNames)
    expect(cond.expression.kind).toBe('and')
  })

  it('parses "1 of selection_*" quantifier', () => {
    const cond = SigmaCondition.parse('1 of selection_*', detectionNames)
    expect(cond.expression.kind).toBe('quantifier')
    if (cond.expression.kind === 'quantifier') {
      expect(cond.expression.count).toBe(1)
      expect(cond.expression.pattern).toBe('selection_*')
    }
  })

  it('parses "all of them" quantifier', () => {
    const cond = SigmaCondition.parse('all of them', detectionNames)
    expect(cond.expression.kind).toBe('quantifier')
    if (cond.expression.kind === 'quantifier') {
      expect(cond.expression.count).toBe('all')
      expect(cond.expression.pattern).toBe('them')
    }
  })

  it('parses "1 of them" quantifier', () => {
    const cond = SigmaCondition.parse('1 of them', detectionNames)
    if (cond.expression.kind === 'quantifier') {
      expect(cond.expression.count).toBe(1)
      expect(cond.expression.pattern).toBe('them')
    }
  })

  it('throws SigmaConditionError for near keyword', () => {
    expect(() => SigmaCondition.parse('selection near filter', detectionNames)).toThrow(SigmaConditionError)
    try {
      SigmaCondition.parse('selection near filter', detectionNames)
    } catch (e) {
      if (e instanceof SigmaConditionError) {
        expect(e.message).toContain("'near' is not supported")
      }
    }
  })

  it('throws SigmaConditionError for unknown identifier', () => {
    expect(() => SigmaCondition.parse('unknown_identifier', new Set(['selection']))).toThrow()
  })

  it('parses aggregation: count() > 5', () => {
    const cond = SigmaCondition.parse('selection | count() > 5', detectionNames)
    expect(cond.aggregation).not.toBeNull()
    expect(cond.aggregation!.function).toBe('count')
    expect(cond.aggregation!.field).toBeNull()
    expect(cond.aggregation!.condition.operator).toBe('>')
    expect(cond.aggregation!.condition.threshold).toBe(5)
  })

  it('parses aggregation: count(CommandLine) by User > 3', () => {
    const cond = SigmaCondition.parse('selection | count(CommandLine) by User > 3', detectionNames)
    expect(cond.aggregation!.function).toBe('count')
    expect(cond.aggregation!.field).toBe('CommandLine')
    expect(cond.aggregation!.groupByField).toBe('User')
    expect(cond.aggregation!.condition.threshold).toBe(3)
  })

  it('parses aggregation with min function', () => {
    const cond = SigmaCondition.parse('selection | min(Score) > 10', detectionNames)
    expect(cond.aggregation!.function).toBe('min')
  })

  it('parses aggregation with >= operator', () => {
    const cond = SigmaCondition.parse('selection | count() >= 5', detectionNames)
    expect(cond.aggregation!.condition.operator).toBe('>=')
  })

  it('parses aggregation with < operator', () => {
    const cond = SigmaCondition.parse('selection | count() < 5', detectionNames)
    expect(cond.aggregation!.condition.operator).toBe('<')
  })

  it('parses aggregation with <= operator', () => {
    const cond = SigmaCondition.parse('selection | count() <= 5', detectionNames)
    expect(cond.aggregation!.condition.operator).toBe('<=')
  })

  it('parses aggregation with = operator', () => {
    const cond = SigmaCondition.parse('selection | count() = 5', detectionNames)
    expect(cond.aggregation!.condition.operator).toBe('=')
  })

  it('throws SigmaConditionError when comparison operator is missing in aggregation', () => {
    expect(() =>
      SigmaCondition.parse('selection | count() and 5', detectionNames),
    ).toThrow(SigmaConditionError)
  })

  it('throws SigmaConditionError when threshold number is missing after operator', () => {
    expect(() =>
      SigmaCondition.parse('selection | count() > end', detectionNames),
    ).toThrow(SigmaConditionError)
  })
})

describe('Condition expression: near throws correct message', () => {
  it('near throws SigmaConditionError with exact message', () => {
    let caught: SigmaConditionError | null = null
    try {
      SigmaCondition.parse('near', detectionNames)
    } catch (e) {
      if (e instanceof SigmaConditionError) caught = e
    }
    expect(caught).not.toBeNull()
    expect(caught!.message).toBe(
      "'near' is not supported — use Sigma Correlation Rules for temporal proximity detection",
    )
  })
})
