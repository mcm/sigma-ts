# sigma-ts

## 0.1.0

### Minor Changes

- Initial release of sigma-ts.

  TypeScript implementation of the Sigma rule processing model, including:
  - Parsing Sigma rules from YAML (`SigmaRule.fromYAML`, `SigmaCollection`)
  - Full modifier support: `contains`, `startswith`, `endswith`, `re`, `cidr`, `base64`, `base64offset`, `wide`, `utf16`, `windash`, `all`, `exists`, `fieldref`, `expand`, `lt`/`lte`/`gt`/`gte`, `i`
  - Condition expression parser with `and`/`or`/`not`, quantifiers (`1 of`, `all of`), and aggregations (`count() > N`)
  - Processing pipeline system with field mapping, string replacement, logsource transformation, and 13 condition types
  - 16 built-in rule validators
  - Node.js filesystem loader (`loadRulesFromDirectory`) with symlink-cycle protection
  - Browser-safe `sigma-ts/core` entry point (< 15 KB gzip)
  - Validated against the full SigmaHQ/sigma production rule corpus (3,549 rules, 0 errors)
