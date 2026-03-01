export type AggregationFunction = 'count' | 'min' | 'max' | 'avg' | 'sum'
export type ComparisonOperator = '<' | '<=' | '>' | '>=' | '='

export interface SigmaAggregationCondition {
  readonly operator: ComparisonOperator
  readonly threshold: number
}

export class SigmaAggregationExpression {
  readonly function: AggregationFunction
  readonly field: string | null
  readonly groupByField: string | null
  readonly condition: SigmaAggregationCondition

  constructor(params: {
    function: AggregationFunction
    field: string | null
    groupByField: string | null
    condition: SigmaAggregationCondition
  }) {
    this.function = params.function
    this.field = params.field
    this.groupByField = params.groupByField
    this.condition = params.condition
  }
}
