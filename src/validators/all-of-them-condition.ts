import { SigmaValidator } from './base.js'
import type { SigmaValidationIssue } from './base.js'
import type { SigmaRule } from '../rule.js'
import type { ASTNode } from '../condition.js'

export class AllOfThemConditionValidator extends SigmaValidator {
  validate(rule: SigmaRule): SigmaValidationIssue[] {
    const issues: SigmaValidationIssue[] = []
    for (const cond of rule.detection.condition) {
      const expr = cond.expression
      if (hasAllOfThem(expr)) {
        issues.push({
          severity: 'warning',
          message: 'Condition uses "all of them" which is often unintentional',
          rule,
        })
      }
    }
    return issues
  }
}

function hasAllOfThem(node: ASTNode): boolean {
  switch (node.kind) {
    case 'quantifier':
      return node.count === 'all' && node.pattern === 'them'
    case 'and':
    case 'or':
      return hasAllOfThem(node.left) || hasAllOfThem(node.right)
    case 'not':
      return hasAllOfThem(node.operand)
    case 'identifier':
      return false
  }
}
