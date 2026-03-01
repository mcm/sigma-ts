import { describe, it, expect } from 'vitest'
import { SigmaAggregationExpression } from '../../src/aggregation.ts'

describe('SigmaAggregationExpression', () => {
  it('stores all fields', () => {
    const agg = new SigmaAggregationExpression({
      function: 'count',
      field: 'CommandLine',
      groupByField: 'User',
      condition: { operator: '>', threshold: 5 },
    })
    expect(agg.function).toBe('count')
    expect(agg.field).toBe('CommandLine')
    expect(agg.groupByField).toBe('User')
    expect(agg.condition.operator).toBe('>')
    expect(agg.condition.threshold).toBe(5)
  })

  it('accepts null field and groupByField', () => {
    const agg = new SigmaAggregationExpression({
      function: 'count',
      field: null,
      groupByField: null,
      condition: { operator: '>=', threshold: 10 },
    })
    expect(agg.field).toBeNull()
    expect(agg.groupByField).toBeNull()
  })
})
