export class SigmaExpansion {
  readonly placeholder: string

  constructor(placeholder: string) {
    this.placeholder = placeholder
  }

  toString(): string {
    return this.placeholder
  }

  equals(other: SigmaExpansion): boolean {
    return this.placeholder === other.placeholder
  }
}
