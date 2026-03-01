import { describe, it, expect } from 'vitest'
import { SigmaRule } from '../../../src/rule.ts'
import { SigmaDetectionItem } from '../../../src/detection.ts'
import { LogsourceCondition } from '../../../src/processing/conditions/logsource.ts'
import { RuleTagCondition } from '../../../src/processing/conditions/rule-tag.ts'
import { RuleContainsFieldCondition } from '../../../src/processing/conditions/rule-contains-field.ts'
import { RuleContainsDetectionItemCondition } from '../../../src/processing/conditions/rule-contains-detection-item.ts'
import { RuleProcessingItemAppliedCondition } from '../../../src/processing/conditions/rule-processing-item-applied.ts'
import { RuleProcessingStateCondition } from '../../../src/processing/conditions/rule-processing-state.ts'
import { DetectionItemFieldNameCondition } from '../../../src/processing/conditions/detection-item-field-name.ts'
import { DetectionItemModifierCondition } from '../../../src/processing/conditions/detection-item-modifier.ts'
import { DetectionItemValueCondition } from '../../../src/processing/conditions/detection-item-value.ts'
import { DetectionItemProcessingItemAppliedCondition } from '../../../src/processing/conditions/detection-item-processing-item-applied.ts'
import { DetectionItemProcessingStateCondition } from '../../../src/processing/conditions/detection-item-processing-state.ts'
import type { PipelineState } from '../../../src/processing/conditions/base.ts'
import { SigmaString } from '../../../src/types/index.ts'

const emptyState: PipelineState = {
  appliedItems: new Set(),
  customState: new Map(),
}

const WINDOWS_RULE_YAML = `
title: Windows Test Rule
id: 12345678-1234-1234-1234-123456789012
tags:
  - attack.t1059
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    CommandLine|contains: powershell
  condition: selection
`

const rule = SigmaRule.fromYAML(WINDOWS_RULE_YAML)

describe('LogsourceCondition', () => {
  it('matches rule with matching logsource', () => {
    const cond = new LogsourceCondition({ product: 'windows', category: 'process_creation' })
    expect(cond.matchesRule(rule, emptyState)).toBe(true)
  })

  it('rejects rule with non-matching logsource', () => {
    const cond = new LogsourceCondition({ product: 'linux' })
    expect(cond.matchesRule(rule, emptyState)).toBe(false)
  })

  it('matches with partial condition (only product)', () => {
    const cond = new LogsourceCondition({ product: 'windows' })
    expect(cond.matchesRule(rule, emptyState)).toBe(true)
  })
})

describe('RuleTagCondition', () => {
  it('matches rule with matching tag', () => {
    const cond = new RuleTagCondition('attack.t1059')
    expect(cond.matchesRule(rule, emptyState)).toBe(true)
  })

  it('rejects rule without matching tag', () => {
    const cond = new RuleTagCondition('attack.t1234')
    expect(cond.matchesRule(rule, emptyState)).toBe(false)
  })
})

describe('RuleContainsFieldCondition', () => {
  it('matches when rule has the field', () => {
    const cond = new RuleContainsFieldCondition('CommandLine')
    expect(cond.matchesRule(rule, emptyState)).toBe(true)
  })

  it('rejects when rule does not have the field', () => {
    const cond = new RuleContainsFieldCondition('NotAField')
    expect(cond.matchesRule(rule, emptyState)).toBe(false)
  })
})

describe('RuleProcessingItemAppliedCondition', () => {
  it('returns false when item not applied', () => {
    const cond = new RuleProcessingItemAppliedCondition('item-1')
    expect(cond.matchesRule(rule, emptyState)).toBe(false)
  })

  it('returns true when item is in state.appliedItems', () => {
    const state: PipelineState = {
      appliedItems: new Set(['item-1']),
      customState: new Map(),
    }
    const cond = new RuleProcessingItemAppliedCondition('item-1')
    expect(cond.matchesRule(rule, state)).toBe(true)
  })
})

describe('RuleProcessingStateCondition', () => {
  it('matches when state has the key/value', () => {
    const state: PipelineState = {
      appliedItems: new Set(),
      customState: new Map([['pipeline_type', 'windows']]),
    }
    const cond = new RuleProcessingStateCondition('pipeline_type', 'windows')
    expect(cond.matchesRule(rule, state)).toBe(true)
  })

  it('rejects when state value does not match', () => {
    const cond = new RuleProcessingStateCondition('pipeline_type', 'linux')
    expect(cond.matchesRule(rule, emptyState)).toBe(false)
  })
})

describe('DetectionItemFieldNameCondition', () => {
  it('matches item with field matching pattern', () => {
    const item = SigmaDetectionItem.fromDict('CommandLine|contains', 'test')
    const cond = new DetectionItemFieldNameCondition('CommandLine*')
    expect(cond.matchesDetectionItem(item, emptyState)).toBe(true)
  })

  it('rejects item with non-matching field', () => {
    const item = SigmaDetectionItem.fromDict('Image', 'test.exe')
    const cond = new DetectionItemFieldNameCondition('CommandLine*')
    expect(cond.matchesDetectionItem(item, emptyState)).toBe(false)
  })

  it('rejects keyword items (null field)', () => {
    const item = SigmaDetectionItem.fromKeyword('test')
    const cond = new DetectionItemFieldNameCondition('*')
    expect(cond.matchesDetectionItem(item, emptyState)).toBe(false)
  })
})

describe('DetectionItemModifierCondition', () => {
  it('matches item with the specified modifier', () => {
    const item = SigmaDetectionItem.fromDict('CommandLine|contains', 'test')
    const cond = new DetectionItemModifierCondition('contains')
    expect(cond.matchesDetectionItem(item, emptyState)).toBe(true)
  })

  it('rejects item without the specified modifier', () => {
    const item = SigmaDetectionItem.fromDict('CommandLine', 'test')
    const cond = new DetectionItemModifierCondition('contains')
    expect(cond.matchesDetectionItem(item, emptyState)).toBe(false)
  })
})

describe('RuleContainsDetectionItemCondition', () => {
  it('matches when any detection item satisfies all sub-conditions', () => {
    const subCond = new DetectionItemFieldNameCondition('CommandLine')
    const cond = new RuleContainsDetectionItemCondition([subCond])
    expect(cond.matchesRule(rule, emptyState)).toBe(true)
  })

  it('returns false when no detection item satisfies sub-conditions', () => {
    const subCond = new DetectionItemFieldNameCondition('NonExistentField')
    const cond = new RuleContainsDetectionItemCondition([subCond])
    expect(cond.matchesRule(rule, emptyState)).toBe(false)
  })

  it('matchesDetectionItem always returns false', () => {
    const cond = new RuleContainsDetectionItemCondition([])
    const item = SigmaDetectionItem.fromDict('CommandLine', 'test')
    expect(cond.matchesDetectionItem(item, emptyState)).toBe(false)
  })
})

describe('DetectionItemValueCondition', () => {
  it('matches when predicate returns true for at least one value', () => {
    const item = SigmaDetectionItem.fromDict('CommandLine', 'powershell')
    const cond = new DetectionItemValueCondition(
      v => v instanceof SigmaString && v.toString() === 'powershell',
    )
    expect(cond.matchesDetectionItem(item, emptyState)).toBe(true)
  })

  it('rejects when predicate returns false for all values', () => {
    const item = SigmaDetectionItem.fromDict('CommandLine', 'cmd.exe')
    const cond = new DetectionItemValueCondition(
      v => v instanceof SigmaString && v.toString() === 'powershell',
    )
    expect(cond.matchesDetectionItem(item, emptyState)).toBe(false)
  })

  it('matchesRule always returns false', () => {
    const cond = new DetectionItemValueCondition(() => true)
    expect(cond.matchesRule(rule, emptyState)).toBe(false)
  })
})

describe('DetectionItemProcessingItemAppliedCondition', () => {
  it('returns false when item not in applied set', () => {
    const item = SigmaDetectionItem.fromDict('CommandLine', 'test')
    const cond = new DetectionItemProcessingItemAppliedCondition('item-x')
    expect(cond.matchesDetectionItem(item, emptyState)).toBe(false)
  })

  it('returns true when item is in state.appliedItems', () => {
    const item = SigmaDetectionItem.fromDict('CommandLine', 'test')
    const state: PipelineState = {
      appliedItems: new Set(['item-x']),
      customState: new Map(),
    }
    const cond = new DetectionItemProcessingItemAppliedCondition('item-x')
    expect(cond.matchesDetectionItem(item, state)).toBe(true)
  })

  it('matchesRule always returns false', () => {
    const cond = new DetectionItemProcessingItemAppliedCondition('item-x')
    expect(cond.matchesRule(rule, emptyState)).toBe(false)
  })
})

describe('DetectionItemProcessingStateCondition', () => {
  it('matches when state has the expected key/value', () => {
    const item = SigmaDetectionItem.fromDict('CommandLine', 'test')
    const state: PipelineState = {
      appliedItems: new Set(),
      customState: new Map([['mode', 'audit']]),
    }
    const cond = new DetectionItemProcessingStateCondition('mode', 'audit')
    expect(cond.matchesDetectionItem(item, state)).toBe(true)
  })

  it('rejects when state value does not match', () => {
    const item = SigmaDetectionItem.fromDict('CommandLine', 'test')
    const cond = new DetectionItemProcessingStateCondition('mode', 'enforce')
    expect(cond.matchesDetectionItem(item, emptyState)).toBe(false)
  })

  it('matchesRule always returns false', () => {
    const cond = new DetectionItemProcessingStateCondition('mode', 'audit')
    expect(cond.matchesRule(rule, emptyState)).toBe(false)
  })
})

describe('ProcessingPipeline', () => {
  it('merge combines pipeline items', async () => {
    const { ProcessingPipeline } = await import('../../../src/processing/pipeline.ts')
    const p1 = new ProcessingPipeline({ items: [] })
    const p2 = new ProcessingPipeline({ items: [] })
    const merged = ProcessingPipeline.merge([p1, p2])
    expect(merged.items).toHaveLength(0)
  })

  it('fromName throws SigmaPluginError for unknown name', async () => {
    const { ProcessingPipeline } = await import('../../../src/processing/pipeline.ts')
    const { SigmaPluginError } = await import('../../../src/exceptions.ts')
    expect(() => ProcessingPipeline.fromName('unknown_pipeline')).toThrow(SigmaPluginError)
  })
})
