/**
 * SigmaString - The foundational string value type in sigma-ts.
 * Represents strings that may contain wildcard characters (* and ?).
 */

export type SigmaStringPart =
  | { readonly kind: 'plain'; readonly value: string }
  | { readonly kind: 'wildcard'; readonly wildcard: '*' | '?' }

export class SigmaString {
  readonly parts: readonly SigmaStringPart[]

  private constructor(parts: readonly SigmaStringPart[]) {
    // Merge adjacent plain parts for efficiency
    const merged: SigmaStringPart[] = []
    for (const part of parts) {
      const last = merged[merged.length - 1]
      if (part.kind === 'plain' && last !== undefined && last.kind === 'plain') {
        merged[merged.length - 1] = { kind: 'plain', value: last.value + part.value }
      } else {
        merged.push(part)
      }
    }
    this.parts = merged
  }

  /**
   * Create a SigmaString from a raw string, parsing * and ? as wildcards.
   * Backslash-escape \* and \? to treat them as literals.
   */
  static from(raw: string): SigmaString {
    const parts: SigmaStringPart[] = []
    let i = 0
    let plainBuf = ''

    while (i < raw.length) {
      const ch = raw[i]
      if (ch === undefined) break

      if (ch === '\\' && i + 1 < raw.length) {
        const next = raw[i + 1]
        if (next === '*' || next === '?') {
          plainBuf += next
          i += 2
          continue
        }
      }

      if (ch === '*' || ch === '?') {
        if (plainBuf.length > 0) {
          parts.push({ kind: 'plain', value: plainBuf })
          plainBuf = ''
        }
        parts.push({ kind: 'wildcard', wildcard: ch })
        i++
        continue
      }

      plainBuf += ch
      i++
    }

    if (plainBuf.length > 0) {
      parts.push({ kind: 'plain', value: plainBuf })
    }

    return new SigmaString(parts)
  }

  /**
   * Create a SigmaString from already-parsed parts.
   */
  static fromParts(parts: readonly SigmaStringPart[]): SigmaString {
    return new SigmaString(parts)
  }

  /**
   * Create a plain SigmaString (no wildcards) from a string.
   */
  static plain(value: string): SigmaString {
    return new SigmaString(value.length > 0 ? [{ kind: 'plain', value }] : [])
  }

  /**
   * Returns the string value. Wildcards are represented by their characters.
   */
  plain_value(): string {
    return this.parts
      .map((p) => (p.kind === 'plain' ? p.value : p.wildcard))
      .join('')
  }

  /**
   * Returns whether the string contains any wildcard.
   */
  contains_wildcard(): boolean {
    return this.parts.some((p) => p.kind === 'wildcard')
  }

  /**
   * Returns whether the string starts with the given plain prefix
   * (i.e., the first part is a plain string starting with prefix,
   * without any wildcard appearing before the end of prefix).
   */
  startswith(prefix: string): boolean {
    if (prefix.length === 0) return true
    const first = this.parts[0]
    if (first === undefined || first.kind !== 'plain') return false
    return first.value.startsWith(prefix)
  }

  /**
   * Returns whether the string ends with the given plain suffix.
   */
  endswith(suffix: string): boolean {
    if (suffix.length === 0) return true
    const last = this.parts[this.parts.length - 1]
    if (last === undefined || last.kind !== 'plain') return false
    return last.value.endsWith(suffix)
  }

  /**
   * Convert to a regex pattern string.
   * Plain parts have regex metacharacters escaped.
   * Wildcards: * → .*, ? → .
   */
  to_regex(): string {
    return this.parts
      .map((p) => {
        if (p.kind === 'plain') {
          return escapeRegex(p.value)
        }
        return p.wildcard === '*' ? '.*' : '.'
      })
      .join('')
  }

  /**
   * Return a new SigmaString that is the concatenation of this and other.
   */
  concat(other: SigmaString): SigmaString {
    return new SigmaString([...this.parts, ...other.parts])
  }

  /**
   * Human-readable string representation.
   */
  toString(): string {
    return this.plain_value()
  }

  /**
   * Structural equality check.
   */
  equals(other: SigmaString): boolean {
    if (this.parts.length !== other.parts.length) return false
    for (let i = 0; i < this.parts.length; i++) {
      const a = this.parts[i]
      const b = other.parts[i]
      if (a === undefined || b === undefined) return false
      if (a.kind !== b.kind) return false
      if (a.kind === 'plain' && b.kind === 'plain' && a.value !== b.value) return false
      if (a.kind === 'wildcard' && b.kind === 'wildcard' && a.wildcard !== b.wildcard) return false
    }
    return true
  }
}

/**
 * Escape a string for use in a regex pattern.
 */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
