/**
 * Convert a glob pattern (supporting only `*` as wildcard) to a RegExp.
 * All other regex metacharacters in the pattern are escaped.
 */
export function globToRegex(pattern: string, caseInsensitive = false): RegExp {
  const regexStr = '^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'
  return new RegExp(regexStr, caseInsensitive ? 'i' : '')
}

/**
 * Test whether a glob pattern matches a value.
 */
export function globMatch(pattern: string, value: string, caseInsensitive = false): boolean {
  return globToRegex(pattern, caseInsensitive).test(value)
}
