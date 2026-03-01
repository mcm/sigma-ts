export class SigmaLogsource {
  readonly category: string | undefined
  readonly product: string | undefined
  readonly service: string | undefined
  readonly definition: string | undefined
  readonly custom: Readonly<Record<string, string>>

  constructor(params: {
    category?: string
    product?: string
    service?: string
    definition?: string
    custom?: Record<string, string>
  }) {
    this.category = params.category
    this.product = params.product
    this.service = params.service
    this.definition = params.definition
    this.custom = params.custom ?? {}
  }

  static fromDict(dict: Record<string, unknown>): SigmaLogsource {
    const known = new Set(['category', 'product', 'service', 'definition'])
    const custom: Record<string, string> = {}

    for (const [key, value] of Object.entries(dict)) {
      if (!known.has(key)) {
        custom[key] = String(value)
      }
    }

    const params: {
      category?: string
      product?: string
      service?: string
      definition?: string
      custom: Record<string, string>
    } = { custom }

    if (typeof dict['category'] === 'string') {
      params.category = dict['category']
    }
    if (typeof dict['product'] === 'string') {
      params.product = dict['product']
    }
    if (typeof dict['service'] === 'string') {
      params.service = dict['service']
    }
    if (typeof dict['definition'] === 'string') {
      params.definition = dict['definition']
    }

    return new SigmaLogsource(params)
  }

  /**
   * Returns true if this logsource matches the other logsource.
   * Undefined fields in `this` act as wildcards (match anything).
   * Used by pipeline conditions to check if a rule's logsource matches
   * a condition's target logsource.
   */
  matches(other: SigmaLogsource): boolean {
    if (this.category !== undefined && this.category !== other.category) return false
    if (this.product !== undefined && this.product !== other.product) return false
    if (this.service !== undefined && this.service !== other.service) return false
    return true
  }
}
