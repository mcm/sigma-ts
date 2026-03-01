export class SigmaNumber {
  readonly value: number

  constructor(value: number) {
    this.value = value
  }

  static from(raw: unknown): SigmaNumber {
    if (typeof raw === 'number') return new SigmaNumber(raw)
    if (typeof raw === 'string') {
      const n = Number(raw)
      if (!isNaN(n)) return new SigmaNumber(n)
    }
    throw new Error(`Cannot convert ${String(raw)} to SigmaNumber`)
  }

  toString(): string {
    return String(this.value)
  }

  equals(other: SigmaNumber): boolean {
    return this.value === other.value
  }
}
