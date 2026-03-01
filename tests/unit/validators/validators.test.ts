import { describe, it, expect } from 'vitest'
import { SigmaRule } from '../../../src/rule.ts'
import { SigmaCollection } from '../../../src/collection.ts'
import { SigmaCollectionValidator } from '../../../src/validators/collection-validator.ts'
import { IdentifierExistsValidator } from '../../../src/validators/identifier-exists.ts'
import { IdentifierUniquenessValidator } from '../../../src/validators/identifier-uniqueness.ts'
import { TitleLengthValidator } from '../../../src/validators/title-length.ts'
import { TagValidator } from '../../../src/validators/tag.ts'
import { ATTACKTagValidator } from '../../../src/validators/attack-tag.ts'
import { StatusExistsValidator } from '../../../src/validators/status-exists.ts'
import { DateExistsValidator } from '../../../src/validators/date-exists.ts'
import { DescriptionExistsValidator } from '../../../src/validators/description-exists.ts'
import { FalsePositivesExistsValidator } from '../../../src/validators/false-positives-exists.ts'
import { LevelExistsValidator } from '../../../src/validators/level-exists.ts'
import { AllOfThemConditionValidator } from '../../../src/validators/all-of-them-condition.ts'
import { TimespanConditionValidator } from '../../../src/validators/timespan-condition.ts'
import { WildcardsInsteadOfContainsValidator } from '../../../src/validators/wildcards-instead-of-contains.ts'
import { SigmaTagValidator } from '../../../src/validators/sigma-tag.ts'
import { DuplicateTitleValidator } from '../../../src/validators/duplicate-title.ts'
import { DuplicateFilenameValidator } from '../../../src/validators/duplicate-filename.ts'

const GOOD_RULE_YAML = `
title: Good Rule
id: 12345678-1234-1234-1234-123456789012
status: stable
description: A well-formed rule
author: Test
date: 2024-01-01
level: medium
tags:
  - attack.t1059
  - attack.execution
falsepositives:
  - None
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    CommandLine|contains: powershell
  condition: selection
`

const good = SigmaRule.fromYAML(GOOD_RULE_YAML)

describe('IdentifierExistsValidator', () => {
  it('passes for rule with id', () => {
    expect(new IdentifierExistsValidator().validate(good)).toHaveLength(0)
  })

  it('fails for rule without id', () => {
    const rule = SigmaRule.fromYAML(`
title: No ID
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: test
  condition: selection
`)
    expect(new IdentifierExistsValidator().validate(rule)).toHaveLength(1)
    expect(new IdentifierExistsValidator().validate(rule)[0]!.severity).toBe('error')
  })
})

describe('IdentifierUniquenessValidator', () => {
  it('passes for unique ids in collection', () => {
    const collection = SigmaCollection.fromYAMLList([GOOD_RULE_YAML])
    const ruleFromCollection = collection.get(0)
    const issues = new IdentifierUniquenessValidator().validate(ruleFromCollection, collection)
    expect(issues).toHaveLength(0)
  })

  it('fails for duplicate ids', () => {
    const collection = SigmaCollection.fromYAMLList([GOOD_RULE_YAML, GOOD_RULE_YAML])
    const issues = new IdentifierUniquenessValidator().validate(collection.get(0), collection)
    expect(issues.length).toBeGreaterThan(0)
  })

  it('reuses index cache across multiple calls on same instance', () => {
    const collection = SigmaCollection.fromYAMLList([GOOD_RULE_YAML, GOOD_RULE_YAML])
    const validator = new IdentifierUniquenessValidator()
    validator.validate(collection.get(0), collection) // builds cache
    const issues = validator.validate(collection.get(1), collection) // reuses cache
    expect(issues.length).toBeGreaterThan(0)
  })
})

describe('TitleLengthValidator', () => {
  it('passes for short title', () => {
    expect(new TitleLengthValidator().validate(good)).toHaveLength(0)
  })

  it('warns for title exceeding 110 chars', () => {
    const longTitle = 'A'.repeat(111)
    const rule = SigmaRule.fromYAML(`
title: "${longTitle}"
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: test
  condition: selection
`)
    const issues = new TitleLengthValidator().validate(rule)
    expect(issues).toHaveLength(1)
    expect(issues[0]!.severity).toBe('warning')
  })

  it('respects custom maxLength', () => {
    const rule = SigmaRule.fromYAML(`
title: Short
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: test
  condition: selection
`)
    expect(new TitleLengthValidator(3).validate(rule)).toHaveLength(1)
  })
})

describe('TagValidator', () => {
  it('passes for valid namespace.value tags', () => {
    expect(new TagValidator().validate(good)).toHaveLength(0)
  })

  it('passes for a rule with no tags', () => {
    const rule = SigmaRule.fromYAML(`
title: No Tags
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: test
  condition: selection
`)
    expect(new TagValidator().validate(rule)).toHaveLength(0)
  })

  it('fails for a tag without dot separator', () => {
    const rule = SigmaRule.fromYAML(`
title: Bad Tag
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: test
  condition: selection
tags:
  - badtag
`)
    const issues = new TagValidator().validate(rule)
    expect(issues).toHaveLength(1)
    expect(issues[0]!.severity).toBe('error')
  })
})

describe('ATTACKTagValidator', () => {
  it('passes for valid ATT&CK technique tags', () => {
    expect(new ATTACKTagValidator().validate(good)).toHaveLength(0)
  })

  it('passes for attack.t1059.001', () => {
    const rule = SigmaRule.fromYAML(`
title: Sub-technique
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: test
  condition: selection
tags:
  - attack.t1059.001
`)
    expect(new ATTACKTagValidator().validate(rule)).toHaveLength(0)
  })

  it('fails for invalid ATT&CK tag like attack.t9999', () => {
    const rule = SigmaRule.fromYAML(`
title: Bad Attack Tag
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: test
  condition: selection
tags:
  - attack.notavalidtag
`)
    expect(new ATTACKTagValidator().validate(rule)).toHaveLength(1)
    expect(new ATTACKTagValidator().validate(rule)[0]!.severity).toBe('error')
  })
})

describe('StatusExistsValidator', () => {
  it('passes for rule with status', () => {
    expect(new StatusExistsValidator().validate(good)).toHaveLength(0)
  })

  it('warns for rule without status', () => {
    const rule = SigmaRule.fromYAML(`
title: No Status
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: test
  condition: selection
`)
    expect(new StatusExistsValidator().validate(rule)).toHaveLength(1)
  })
})

describe('DateExistsValidator', () => {
  it('passes for rule with date', () => {
    expect(new DateExistsValidator().validate(good)).toHaveLength(0)
  })

  it('warns if no date', () => {
    const rule = SigmaRule.fromYAML(`
title: No Date
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: test
  condition: selection
`)
    expect(new DateExistsValidator().validate(rule)).toHaveLength(1)
  })
})

describe('DescriptionExistsValidator', () => {
  it('passes for rule with description', () => {
    expect(new DescriptionExistsValidator().validate(good)).toHaveLength(0)
  })

  it('informational if no description', () => {
    const rule = SigmaRule.fromYAML(`
title: No Desc
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: test
  condition: selection
`)
    const issues = new DescriptionExistsValidator().validate(rule)
    expect(issues).toHaveLength(1)
    expect(issues[0]!.severity).toBe('informational')
  })
})

describe('FalsePositivesExistsValidator', () => {
  it('passes for rule with falsepositives', () => {
    expect(new FalsePositivesExistsValidator().validate(good)).toHaveLength(0)
  })

  it('informational if no falsepositives', () => {
    const rule = SigmaRule.fromYAML(`
title: No FP
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: test
  condition: selection
`)
    expect(new FalsePositivesExistsValidator().validate(rule)).toHaveLength(1)
  })
})

describe('LevelExistsValidator', () => {
  it('passes for rule with level', () => {
    expect(new LevelExistsValidator().validate(good)).toHaveLength(0)
  })

  it('warns if no level', () => {
    const rule = SigmaRule.fromYAML(`
title: No Level
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: test
  condition: selection
`)
    expect(new LevelExistsValidator().validate(rule)).toHaveLength(1)
  })
})

describe('SigmaTagValidator', () => {
  it('passes for known namespace', () => {
    expect(new SigmaTagValidator().validate(good)).toHaveLength(0)
  })

  it('fails for unknown namespace', () => {
    const rule = SigmaRule.fromYAML(`
title: Custom NS
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: test
  condition: selection
tags:
  - myorg.custom_tag
`)
    expect(new SigmaTagValidator().validate(rule)).toHaveLength(1)
  })
})

describe('AllOfThemConditionValidator', () => {
  it('passes for condition with and/or/not (without all of them)', () => {
    const rule = SigmaRule.fromYAML(`
title: Complex Condition
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: test
  filter:
    Image: cmd.exe
  condition: selection and not filter
`)
    expect(new AllOfThemConditionValidator().validate(rule)).toHaveLength(0)
  })

  it('passes for or condition without all of them', () => {
    const rule = SigmaRule.fromYAML(`
title: Or Condition
logsource:
  category: process_creation
detection:
  selection_a:
    CommandLine: test1
  selection_b:
    CommandLine: test2
  condition: selection_a or selection_b
`)
    expect(new AllOfThemConditionValidator().validate(rule)).toHaveLength(0)
  })

  it('warns for all of them condition', () => {
    const rule = SigmaRule.fromYAML(`
title: All Of Them
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: test
  filter:
    Image: cmd.exe
  condition: all of them
`)
    expect(new AllOfThemConditionValidator().validate(rule)).toHaveLength(1)
    expect(new AllOfThemConditionValidator().validate(rule)[0]!.severity).toBe('warning')
  })

  it('passes for normal condition', () => {
    expect(new AllOfThemConditionValidator().validate(good)).toHaveLength(0)
  })
})

describe('TimespanConditionValidator', () => {
  it('passes when timeframe has aggregation condition', () => {
    const rule = SigmaRule.fromYAML(`
title: Timeframe With Agg
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: test
  condition: selection | count() > 5
  timeframe: 5m
`)
    expect(new TimespanConditionValidator().validate(rule)).toHaveLength(0)
  })

  it('fails when timeframe has no aggregation', () => {
    const rule = SigmaRule.fromYAML(`
title: Timeframe No Agg
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: test
  condition: selection
  timeframe: 5m
`)
    expect(new TimespanConditionValidator().validate(rule)).toHaveLength(1)
    expect(new TimespanConditionValidator().validate(rule)[0]!.severity).toBe('error')
  })
})

describe('WildcardsInsteadOfContainsValidator', () => {
  it('passes for value with contains modifier', () => {
    expect(new WildcardsInsteadOfContainsValidator().validate(good)).toHaveLength(0)
  })

  it('passes for plain value without surrounding wildcards', () => {
    const rule = SigmaRule.fromYAML(`
title: Plain Value
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: powershell
  condition: selection
`)
    expect(new WildcardsInsteadOfContainsValidator().validate(rule)).toHaveLength(0)
  })

  it('warns for value with surrounding wildcards without contains', () => {
    const rule = SigmaRule.fromYAML(`
title: Wildcards
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: '*powershell*'
  condition: selection
`)
    expect(new WildcardsInsteadOfContainsValidator().validate(rule)).toHaveLength(1)
  })
})

describe('DuplicateTitleValidator', () => {
  it('passes when titles are unique', () => {
    const collection = SigmaCollection.fromYAMLList([GOOD_RULE_YAML])
    expect(new DuplicateTitleValidator().validate(collection.get(0), collection)).toHaveLength(0)
  })

  it('warns when two rules have the same title', () => {
    const collection = SigmaCollection.fromYAMLList([GOOD_RULE_YAML, GOOD_RULE_YAML])
    const issues = new DuplicateTitleValidator().validate(collection.get(0), collection)
    expect(issues).toHaveLength(1)
    expect(issues[0]!.severity).toBe('warning')
  })

  it('passes without a collection', () => {
    expect(new DuplicateTitleValidator().validate(good)).toHaveLength(0)
  })

  it('reuses index cache across multiple calls on same instance', () => {
    const collection = SigmaCollection.fromYAMLList([GOOD_RULE_YAML, GOOD_RULE_YAML])
    const validator = new DuplicateTitleValidator()
    validator.validate(collection.get(0), collection) // builds cache
    const issues = validator.validate(collection.get(1), collection) // reuses cache
    expect(issues).toHaveLength(1)
  })
})

describe('DuplicateFilenameValidator', () => {
  it('passes when no filename attribute is set', () => {
    expect(new DuplicateFilenameValidator().validate(good)).toHaveLength(0)
  })

  it('passes without a collection', () => {
    const rule = good._clone({ customAttributes: new Map([['filename', 'rule.yml']]) })
    expect(new DuplicateFilenameValidator().validate(rule)).toHaveLength(0)
  })

  it('warns when two rules share the same filename', () => {
    const a = good._clone({ customAttributes: new Map([['filename', 'rule.yml']]) })
    const b = good._clone({ customAttributes: new Map([['filename', 'rule.yml']]) })
    const collection = new SigmaCollection([a, b])
    const issues = new DuplicateFilenameValidator().validate(a, collection)
    expect(issues).toHaveLength(1)
    expect(issues[0]!.severity).toBe('warning')
  })

  it('passes when filenames are unique', () => {
    const a = good._clone({ customAttributes: new Map([['filename', 'a.yml']]) })
    const b = good._clone({ customAttributes: new Map([['filename', 'b.yml']]) })
    const collection = new SigmaCollection([a, b])
    expect(new DuplicateFilenameValidator().validate(a, collection)).toHaveLength(0)
  })

  it('reuses index cache across multiple calls on same instance', () => {
    const a = good._clone({ customAttributes: new Map([['filename', 'rule.yml']]) })
    const b = good._clone({ customAttributes: new Map([['filename', 'rule.yml']]) })
    const collection = new SigmaCollection([a, b])
    const validator = new DuplicateFilenameValidator()
    validator.validate(a, collection) // builds cache
    const issues = validator.validate(b, collection) // reuses cache
    expect(issues).toHaveLength(1)
  })
})

describe('SigmaCollectionValidator', () => {
  it('runs all validators over all rules', () => {
    const collection = SigmaCollection.fromYAMLList([GOOD_RULE_YAML])
    const validator = new SigmaCollectionValidator([
      new IdentifierExistsValidator(),
      new StatusExistsValidator(),
    ])
    const issues = validator.validate(collection)
    expect(issues).toHaveLength(0)
  })

  it('collects issues from multiple rules', () => {
    const noIdYaml = `
title: No ID Rule
logsource:
  category: process_creation
detection:
  selection:
    CommandLine: test
  condition: selection
`
    const collection = SigmaCollection.fromYAMLList([GOOD_RULE_YAML, noIdYaml])
    const validator = new SigmaCollectionValidator([new IdentifierExistsValidator()])
    const issues = validator.validate(collection)
    expect(issues).toHaveLength(1) // Only second rule has no id
  })
})
