import { SigmaValidator } from './base.js'
import type { SigmaValidationIssue } from './base.js'
import type { SigmaRule } from '../rule.js'

const DEFAULT_ALLOWED_NAMESPACES = new Set(['attack', 'car', 'cve', 'detection', 'sigma', 'tlp'])

export class SigmaTagValidator extends SigmaValidator {
  private readonly allowedNamespaces: ReadonlySet<string>

  constructor(allowedNamespaces: Iterable<string> = DEFAULT_ALLOWED_NAMESPACES) {
    super()
    this.allowedNamespaces = new Set(allowedNamespaces)
  }

  validate(rule: SigmaRule): SigmaValidationIssue[] {
    const issues: SigmaValidationIssue[] = []
    for (const tag of rule.tags) {
      if (!this.allowedNamespaces.has(tag.namespace)) {
        issues.push({
          severity: 'error',
          message: `Tag namespace "${tag.namespace}" is not in the allowed set`,
          rule,
        })
      }
    }
    return issues
  }
}
