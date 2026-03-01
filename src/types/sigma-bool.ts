export class SigmaBool {
  readonly value: boolean

  constructor(value: boolean) {
    this.value = value
  }

  static from(raw: unknown): SigmaBool {
    if (typeof raw === 'boolean') return new SigmaBool(raw)
    if (raw === 1 || raw === '1' || raw === 'yes' || raw === 'true') return new SigmaBool(true)
    if (raw === 0 || raw === '0' || raw === 'no' || raw === 'false') return new SigmaBool(false)
    throw new Error(`Cannot convert ${String(raw)} to SigmaBool`)
  }

  toString(): string {
    return String(this.value)
  }

  equals(other: SigmaBool): boolean {
    return this.value === other.value
  }
}
