export class SigmaFieldReference {
  readonly referencedField: string

  constructor(referencedField: string) {
    this.referencedField = referencedField
  }

  toString(): string {
    return this.referencedField
  }

  equals(other: SigmaFieldReference): boolean {
    return this.referencedField === other.referencedField
  }
}
