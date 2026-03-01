export class SigmaQueryExpression {
  readonly query: string
  readonly isOpaque = true

  constructor(query: string) {
    this.query = query
  }

  toString(): string {
    return this.query
  }

  equals(other: SigmaQueryExpression): boolean {
    return this.query === other.query
  }
}
