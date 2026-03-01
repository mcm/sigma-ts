export class SigmaNull {
  private static readonly instance = new SigmaNull()

  private constructor() {}

  static getInstance(): SigmaNull {
    return SigmaNull.instance
  }

  toString(): string {
    return 'null'
  }

  equals(other: SigmaNull): boolean {
    return other instanceof SigmaNull
  }
}
