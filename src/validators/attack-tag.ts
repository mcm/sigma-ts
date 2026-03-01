import { SigmaValidator } from './base.js'
import type { SigmaValidationIssue } from './base.js'
import type { SigmaRule } from '../rule.js'

// Valid MITRE ATT&CK tactic shortnames
const VALID_TACTICS = new Set([
  'initial_access', 'execution', 'persistence', 'privilege_escalation',
  'defense_evasion', 'credential_access', 'discovery', 'lateral_movement',
  'collection', 'exfiltration', 'impact', 'command_and_control',
  'resource_development', 'reconnaissance',
])

// Technique pattern: T followed by 4 digits, optionally .3-digit subtechnique
const TECHNIQUE_REGEX = /^t\d{4}(\.\d{3})?$/i

// Group pattern: G followed by 4 digits
const GROUP_REGEX = /^g\d{4}$/i

// Software/tool pattern: S followed by 4 digits
const SOFTWARE_REGEX = /^s\d{4}$/i

// Campaign pattern: C followed by 4 digits
const CAMPAIGN_REGEX = /^c\d{4}$/i

export class ATTACKTagValidator extends SigmaValidator {
  validate(rule: SigmaRule): SigmaValidationIssue[] {
    const issues: SigmaValidationIssue[] = []
    for (const tag of rule.tags) {
      if (tag.namespace !== 'attack') continue
      const name = tag.name.toLowerCase()
      const isValid =
        VALID_TACTICS.has(name) ||
        TECHNIQUE_REGEX.test(name) ||
        GROUP_REGEX.test(name) ||
        SOFTWARE_REGEX.test(name) ||
        CAMPAIGN_REGEX.test(name)
      if (!isValid) {
        issues.push({
          severity: 'error',
          message: `Invalid ATT&CK tag: "${tag.raw}". Expected valid technique (T####.###), tactic, group (G####), software (S####), or campaign (C####)`,
          rule,
        })
      }
    }
    return issues
  }
}
