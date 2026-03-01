import { SigmaTypeError } from '../exceptions.js'

/** Regex matching Python/PCRE-style inline flags at the start of a pattern, e.g. `(?i)`. */
const INLINE_FLAG_RE = /^\(\?([imsx]+)\)/

export class SigmaRegularExpression {
  readonly pattern: string
  private readonly _regexp: RegExp

  /** Maximum allowed pattern length. Patterns beyond this limit are rejected to limit ReDoS exposure. */
  static readonly MAX_PATTERN_LENGTH = 2000

  constructor(pattern: string, extraFlags: string = '') {
    this.pattern = pattern
    if (pattern.length > SigmaRegularExpression.MAX_PATTERN_LENGTH) {
      throw new SigmaTypeError(
        `Regex pattern exceeds maximum length of ${SigmaRegularExpression.MAX_PATTERN_LENGTH} characters`,
      )
    }
    // Convert Python/PCRE-style inline flags (e.g. `(?i)`) to JavaScript regex flags.
    // Only i, m, s are supported in JavaScript; x (verbose) is unsupported and skipped.
    let flags = extraFlags
    let compilablePattern = pattern
    const inlineFlagMatch = INLINE_FLAG_RE.exec(pattern)
    if (inlineFlagMatch) {
      const pcreFlags = inlineFlagMatch[1]!
      if (pcreFlags.includes('i')) flags += 'i'
      if (pcreFlags.includes('m')) flags += 'm'
      if (pcreFlags.includes('s')) flags += 's'
      compilablePattern = pattern.slice(inlineFlagMatch[0].length)
    }
    // Deduplicate flags
    flags = [...new Set(flags)].join('')
    try {
      this._regexp = new RegExp(compilablePattern, flags)
    } catch (e) {
      throw new SigmaTypeError(`Invalid regular expression pattern: ${pattern}`, { cause: e })
    }
  }

  get regexp(): RegExp {
    return this._regexp
  }

  toString(): string {
    return this.pattern
  }

  equals(other: SigmaRegularExpression): boolean {
    return this.pattern === other.pattern
  }
}
