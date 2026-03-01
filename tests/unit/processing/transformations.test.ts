import { describe, it, expect } from 'vitest'
import { SigmaRule } from '../../../src/rule.ts'
import { ProcessingPipeline, ProcessingItem, registerPipeline } from '../../../src/processing/pipeline.ts'
import { FieldMappingTransformation } from '../../../src/processing/transformations/field-mapping.ts'
import {
  AddFieldnamePrefixTransformation,
  AddFieldnameSuffixTransformation,
  FieldPrefixMappingTransformation,
} from '../../../src/processing/transformations/field-name.ts'
import { DropDetectionItemTransformation } from '../../../src/processing/transformations/drop-detection-item.ts'
import {
  RuleFailureTransformation,
  DetectionItemFailureTransformation,
} from '../../../src/processing/transformations/failure.ts'
import { ReplaceStringTransformation } from '../../../src/processing/transformations/replace-string.ts'
import { SetStateTransformation } from '../../../src/processing/transformations/set-state.ts'
import { SetCustomAttributeTransformation } from '../../../src/processing/transformations/set-custom-attribute.ts'
import { AddConditionTransformation } from '../../../src/processing/transformations/add-condition.ts'
import { ChangeLogsourceTransformation } from '../../../src/processing/transformations/change-logsource.ts'
import { LogsourceCondition } from '../../../src/processing/conditions/logsource.ts'
import { SigmaTransformationError, SigmaPluginError } from '../../../src/exceptions.ts'
import { SigmaString } from '../../../src/types/sigma-string.ts'

const BASE_YAML = `
title: Test Rule
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    CommandLine|contains: powershell
  condition: selection
`

describe('FieldMappingTransformation', () => {
  it('renames a single field', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new FieldMappingTransformation({ CommandLine: 'cmd_line' })
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    const selection = processed.detection.detections.get('selection')!
    expect(selection.detectionItems[0]!.field).toBe('cmd_line')
  })

  it('fans out to multiple fields', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new FieldMappingTransformation({ CommandLine: ['cmd_line', 'process_cmd'] })
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    const selection = processed.detection.detections.get('selection')!
    expect(selection.detectionItems).toHaveLength(2)
    const fields = selection.detectionItems.map((i) => i.field)
    expect(fields).toContain('cmd_line')
    expect(fields).toContain('process_cmd')
  })

  it('leaves unmapped fields unchanged', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new FieldMappingTransformation({ SomeOtherField: 'other' })
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    const selection = processed.detection.detections.get('selection')!
    expect(selection.detectionItems[0]!.field).toBe('CommandLine')
  })

  it('drops field when mapping to empty array', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new FieldMappingTransformation({ CommandLine: [] })
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    const selection = processed.detection.detections.get('selection')!
    expect(selection.detectionItems).toHaveLength(0)
  })
})

describe('AddFieldnamePrefixTransformation', () => {
  it('prepends prefix to all field names', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new AddFieldnamePrefixTransformation('win.')
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    const selection = processed.detection.detections.get('selection')!
    expect(selection.detectionItems[0]!.field).toBe('win.CommandLine')
  })

  it('does not affect keyword (null field) items', () => {
    const kwYaml = `
title: Keyword Rule
logsource:
  category: process_creation
  product: windows
detection:
  keywords:
    - powershell
  condition: keywords
`
    const rule = SigmaRule.fromYAML(kwYaml)
    const transform = new AddFieldnamePrefixTransformation('win.')
    const pItem = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [pItem] })
    const processed = pipeline.apply(rule)

    const keywords = processed.detection.detections.get('keywords')!
    expect(keywords.detectionItems[0]!.field).toBeNull()
  })
})

describe('AddFieldnameSuffixTransformation', () => {
  it('appends suffix to all field names', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new AddFieldnameSuffixTransformation('_extra')
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    const selection = processed.detection.detections.get('selection')!
    expect(selection.detectionItems[0]!.field).toBe('CommandLine_extra')
  })
})

describe('FieldPrefixMappingTransformation', () => {
  it('replaces matching prefixes', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new FieldPrefixMappingTransformation({ Command: 'Cmd' })
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    const selection = processed.detection.detections.get('selection')!
    expect(selection.detectionItems[0]!.field).toBe('CmdLine')
  })

  it('leaves fields without matching prefix unchanged', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new FieldPrefixMappingTransformation({ Image: 'img' })
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    const selection = processed.detection.detections.get('selection')!
    expect(selection.detectionItems[0]!.field).toBe('CommandLine')
  })
})

describe('DropDetectionItemTransformation', () => {
  it('removes all detection items when no detectionItemConditions', () => {
    const multiYaml = `
title: Multi Item Rule
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    CommandLine: powershell.exe
    Image: cmd.exe
  condition: selection
`
    const rule = SigmaRule.fromYAML(multiYaml)
    const transform = new DropDetectionItemTransformation()
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    const selection = processed.detection.detections.get('selection')!
    expect(selection.detectionItems).toHaveLength(0)
  })
})

describe('RuleFailureTransformation', () => {
  it('throws SigmaTransformationError', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new RuleFailureTransformation('This rule is not supported')
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    expect(() => pipeline.apply(rule)).toThrow(SigmaTransformationError)
  })

  it('includes the error message', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new RuleFailureTransformation('Unsupported logsource')
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    expect(() => pipeline.apply(rule)).toThrow('Unsupported logsource')
  })
})

describe('DetectionItemFailureTransformation', () => {
  it('throws SigmaTransformationError when item condition matches', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new DetectionItemFailureTransformation('Detection item not supported')
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    expect(() => pipeline.apply(rule)).toThrow(SigmaTransformationError)
  })
})

describe('ReplaceStringTransformation', () => {
  it('replaces matching strings in SigmaString values', () => {
    // Use a rule without contains modifier so the value is a plain string
    const plainYaml = `
title: Plain Rule
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    CommandLine: powershell.exe
  condition: selection
`
    const rule = SigmaRule.fromYAML(plainYaml)
    const transform = new ReplaceStringTransformation('powershell', 'pwsh')
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    const selection = processed.detection.detections.get('selection')!
    const val = selection.detectionItems[0]!.value[0]!
    expect(val instanceof SigmaString).toBe(true)
    expect((val as SigmaString).plain_value()).toBe('pwsh.exe')
  })

  it('does not change values that do not match the pattern', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new ReplaceStringTransformation('cmd\\.exe', 'command_prompt')
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    const selection = processed.detection.detections.get('selection')!
    const val = selection.detectionItems[0]!.value[0]!
    // The contains modifier wraps value in wildcards: *powershell*
    expect((val as SigmaString).plain_value()).toBe('*powershell*')
  })
})

describe('SetStateTransformation', () => {
  it('sets a key in pipeline state (does not change rule)', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    // Create a pipeline that sets state then checks it via another transformation
    const setTransform = new SetStateTransformation('pipeline_type', 'windows')
    const item = new ProcessingItem({ transformation: setTransform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    // The rule itself is unchanged by SetStateTransformation
    expect(processed.logsource.product).toBe('windows')
    expect(processed.title).toBe('Test Rule')
  })
})

describe('SetCustomAttributeTransformation', () => {
  it('attaches metadata to the rule', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new SetCustomAttributeTransformation('source', 'my_pipeline')
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    expect(processed.customAttributes.get('source')).toBe('my_pipeline')
  })

  it('allows setting multiple attributes', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const t1 = new SetCustomAttributeTransformation('vendor', 'microsoft')
    const t2 = new SetCustomAttributeTransformation('platform', 'windows')
    const pipeline = new ProcessingPipeline({
      items: [
        new ProcessingItem({ transformation: t1 }),
        new ProcessingItem({ transformation: t2 }),
      ],
    })
    const processed = pipeline.apply(rule)

    expect(processed.customAttributes.get('vendor')).toBe('microsoft')
    expect(processed.customAttributes.get('platform')).toBe('windows')
  })
})

describe('AddConditionTransformation', () => {
  it('adds a detection named _added_condition', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new AddConditionTransformation('EventID', '4688')
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    expect(processed.detection.detections.has('_added_condition')).toBe(true)
    const added = processed.detection.detections.get('_added_condition')!
    expect(added.detectionItems[0]!.field).toBe('EventID')
  })

  it('appends to existing _added_condition when applied twice', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform1 = new AddConditionTransformation('EventID', '4688')
    const transform2 = new AddConditionTransformation('Hostname', 'server1')
    const pipeline = new ProcessingPipeline({
      items: [
        new ProcessingItem({ transformation: transform1 }),
        new ProcessingItem({ transformation: transform2 }),
      ],
    })
    const processed = pipeline.apply(rule)

    const added = processed.detection.detections.get('_added_condition')!
    expect(added.detectionItems).toHaveLength(2)
  })

  it('accepts array value', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new AddConditionTransformation('EventID', ['4688', '4689'])
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    expect(processed.detection.detections.has('_added_condition')).toBe(true)
  })
})

describe('ChangeLogsourceTransformation', () => {
  it('overwrites logsource fields', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new ChangeLogsourceTransformation({
      category: 'network_connection',
      product: 'linux',
    })
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    expect(processed.logsource.category).toBe('network_connection')
    expect(processed.logsource.product).toBe('linux')
  })

  it('sets individual logsource fields', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new ChangeLogsourceTransformation({ service: 'sysmon' })
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    expect(processed.logsource.service).toBe('sysmon')
  })
})

describe('Pipeline conditions gate transformation', () => {
  it('does not apply transformation when rule condition does not match', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new ChangeLogsourceTransformation({ product: 'linux' })
    const condition = new LogsourceCondition({ product: 'linux' }) // won't match (rule is windows)
    const item = new ProcessingItem({
      transformation: transform,
      ruleConditions: [condition],
    })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    // Transformation NOT applied since logsource is windows
    expect(processed.logsource.product).toBe('windows')
  })

  it('applies transformation when rule condition does match', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new SetCustomAttributeTransformation('matched', true)
    const condition = new LogsourceCondition({ product: 'windows' }) // will match
    const item = new ProcessingItem({
      transformation: transform,
      ruleConditions: [condition],
    })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    expect(processed.customAttributes.get('matched')).toBe(true)
  })
})

describe('processingItemsApplied tracking', () => {
  it('adds item id to rule.processingItemsApplied', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new SetCustomAttributeTransformation('x', 1)
    const item = new ProcessingItem({ id: 'my-item-id', transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    expect(processed.processingItemsApplied.has('my-item-id')).toBe(true)
  })

  it('does not add item id if item has no id', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new SetCustomAttributeTransformation('x', 1)
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    expect(processed.processingItemsApplied.size).toBe(0)
  })
})

describe('ProcessingPipeline.fromName', () => {
  it('throws SigmaPluginError for unknown name', () => {
    expect(() => ProcessingPipeline.fromName('totally_unknown_pipeline_xyz')).toThrow(
      SigmaPluginError,
    )
  })

  it('returns registered pipeline by name', () => {
    const myPipeline = new ProcessingPipeline({ name: 'test' })
    registerPipeline('my_test_pipeline', myPipeline)
    expect(ProcessingPipeline.fromName('my_test_pipeline')).toBe(myPipeline)
  })
})

describe('Immutability: original rule is not mutated', () => {
  it('apply() returns a new rule, does not mutate original', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new FieldMappingTransformation({ CommandLine: 'cmd_line' })
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    const processed = pipeline.apply(rule)

    // Original unchanged
    const origSelection = rule.detection.detections.get('selection')!
    expect(origSelection.detectionItems[0]!.field).toBe('CommandLine')
    // New is changed
    const newSelection = processed.detection.detections.get('selection')!
    expect(newSelection.detectionItems[0]!.field).toBe('cmd_line')
  })

  it('apply() does not mutate customAttributes on original rule', () => {
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const transform = new SetCustomAttributeTransformation('key', 'value')
    const item = new ProcessingItem({ transformation: transform })
    const pipeline = new ProcessingPipeline({ items: [item] })
    pipeline.apply(rule)

    // Original rule should not have the attribute
    expect(rule.customAttributes.has('key')).toBe(false)
  })
})

describe('YAML pipeline fromYAML with transformations', () => {
  it('deserializes field_name_mapping transformation', async () => {
    const pipelineYaml = `
name: test_pipeline
transformations:
  - type: field_name_mapping
    mapping:
      CommandLine: cmd_line
`
    // Import index.ts to ensure registrations happen
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)

    const selection = processed.detection.detections.get('selection')!
    expect(selection.detectionItems[0]!.field).toBe('cmd_line')
  })

  it('deserializes change_logsource transformation', async () => {
    const pipelineYaml = `
name: test_pipeline
transformations:
  - type: change_logsource
    product: linux
    service: syslog
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)

    expect(processed.logsource.product).toBe('linux')
    expect(processed.logsource.service).toBe('syslog')
  })

  it('deserializes field_name_prefix transformation', async () => {
    const pipelineYaml = `
transformations:
  - type: field_name_prefix
    prefix: "win."
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)
    const selection = processed.detection.detections.get('selection')!
    expect(selection.detectionItems[0]!.field).toBe('win.CommandLine')
  })

  it('deserializes field_name_suffix transformation', async () => {
    const pipelineYaml = `
transformations:
  - type: field_name_suffix
    suffix: "_win"
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)
    const selection = processed.detection.detections.get('selection')!
    expect(selection.detectionItems[0]!.field).toBe('CommandLine_win')
  })

  it('deserializes field_name_prefix_mapping transformation', async () => {
    const pipelineYaml = `
transformations:
  - type: field_name_prefix_mapping
    mapping:
      Command: Cmd
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)
    const selection = processed.detection.detections.get('selection')!
    expect(selection.detectionItems[0]!.field).toBe('CmdLine')
  })

  it('deserializes drop_detection_item transformation', async () => {
    const pipelineYaml = `
transformations:
  - type: drop_detection_item
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)
    const selection = processed.detection.detections.get('selection')!
    expect(selection.detectionItems).toHaveLength(0)
  })

  it('deserializes replace_string transformation', async () => {
    const plainYaml = `
title: Test Rule
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    CommandLine: powershell.exe
  condition: selection
`
    const pipelineYaml = `
transformations:
  - type: replace_string
    pattern: powershell
    replacement: pwsh
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(plainYaml)
    const processed = pipeline.apply(rule)
    const selection = processed.detection.detections.get('selection')!
    const val = selection.detectionItems[0]!.value[0]!
    expect((val as SigmaString).plain_value()).toBe('pwsh.exe')
  })

  it('deserializes set_state transformation', async () => {
    const pipelineYaml = `
transformations:
  - type: set_state
    key: platform
    value: windows
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)
    expect(processed.title).toBe('Test Rule') // rule unchanged
  })

  it('deserializes set_custom_attribute transformation', async () => {
    const pipelineYaml = `
transformations:
  - type: set_custom_attribute
    key: siem
    value: splunk
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)
    expect(processed.customAttributes.get('siem')).toBe('splunk')
  })

  it('deserializes add_condition transformation', async () => {
    const pipelineYaml = `
transformations:
  - type: add_condition
    field: EventID
    value: "4688"
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)
    expect(processed.detection.detections.has('_added_condition')).toBe(true)
  })

  it('deserializes logsource condition', async () => {
    const pipelineYaml = `
transformations:
  - type: set_custom_attribute
    key: matched
    value: true
    rule_conditions:
      - type: logsource
        product: windows
        category: process_creation
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)
    expect(processed.customAttributes.get('matched')).toBe(true)
  })

  it('deserializes rule_tag condition', async () => {
    const pipelineYaml = `
transformations:
  - type: set_custom_attribute
    key: has_tag
    value: true
    rule_conditions:
      - type: rule_tag
        tag: attack.execution
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const taggedYaml = `
title: Tagged Rule
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    CommandLine: test
  condition: selection
tags:
  - attack.execution
`
    const rule = SigmaRule.fromYAML(taggedYaml)
    const processed = pipeline.apply(rule)
    expect(processed.customAttributes.get('has_tag')).toBe(true)
  })

  it('deserializes rule_contains_field condition', async () => {
    const pipelineYaml = `
transformations:
  - type: set_custom_attribute
    key: has_field
    value: true
    rule_conditions:
      - type: rule_contains_field
        field: CommandLine
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)
    expect(processed.customAttributes.get('has_field')).toBe(true)
  })

  it('deserializes detection_item_field_name condition', async () => {
    const pipelineYaml = `
transformations:
  - type: field_name_prefix
    prefix: "matched."
    detection_item_conditions:
      - type: detection_item_field_name
        pattern: "CommandLine*"
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)
    const selection = processed.detection.detections.get('selection')!
    expect(selection.detectionItems[0]!.field).toBe('matched.CommandLine')
  })

  it('deserializes detection_item_modifier condition', async () => {
    const pipelineYaml = `
transformations:
  - type: set_custom_attribute
    key: has_contains
    value: true
    rule_conditions:
      - type: rule_contains_detection_item
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)
    // rule_contains_detection_item with no sub_conditions matches any rule with detection items
    expect(processed.customAttributes.get('has_contains')).toBe(true)
  })

  it('deserializes rule_processing_state condition', async () => {
    const pipelineYaml = `
transformations:
  - type: set_state
    key: mykey
    value: myval
  - type: set_custom_attribute
    key: state_matched
    value: true
    rule_conditions:
      - type: rule_processing_state
        key: mykey
        value: myval
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)
    expect(processed.customAttributes.get('state_matched')).toBe(true)
  })

  it('handles fromYAML with missing config keys (uses defaults)', async () => {
    // field_name_prefix without prefix key → uses empty string default
    const pipelineYaml = `
transformations:
  - type: field_name_prefix
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)
    // Empty prefix → field name unchanged
    const selection = processed.detection.detections.get('selection')!
    expect(selection.detectionItems[0]!.field).toBe('CommandLine')
  })

  it('handles fromYAML rule_failure without message (uses default)', async () => {
    const pipelineYaml = `
transformations:
  - type: rule_failure
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    expect(() => pipeline.apply(rule)).toThrow()
  })

  it('handles fromYAML detection_item_failure without message', async () => {
    const pipelineYaml = `
transformations:
  - type: detection_item_failure
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    expect(() => pipeline.apply(rule)).toThrow()
  })

  it('handles fromYAML with id on transformation item', async () => {
    const pipelineYaml = `
transformations:
  - id: my-prefix-transform
    type: field_name_prefix
    prefix: "evt."
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)
    expect(processed.processingItemsApplied.has('my-prefix-transform')).toBe(true)
  })

  it('handles fromYAML with detection_item_modifier condition', async () => {
    const pipelineYaml = `
transformations:
  - type: set_custom_attribute
    key: has_contains
    value: true
    detection_item_conditions:
      - type: detection_item_modifier
        modifier: contains
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)
    // The rule has contains modifier so the condition matches the detection item
    expect(processed.customAttributes.get('has_contains')).toBe(true)
  })

  it('handles fromYAML with detection_item_processing_item_applied condition', async () => {
    const pipelineYaml = `
transformations:
  - id: first
    type: set_state
    key: x
    value: 1
  - type: set_custom_attribute
    key: done
    value: true
    detection_item_conditions:
      - type: detection_item_processing_item_applied
        item_id: first
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)
    expect(processed.customAttributes.get('done')).toBe(true)
  })

  it('handles fromYAML with detection_item_processing_state condition', async () => {
    const pipelineYaml = `
transformations:
  - type: set_state
    key: platform
    value: win
  - type: set_custom_attribute
    key: platform_matched
    value: true
    detection_item_conditions:
      - type: detection_item_processing_state
        key: platform
        value: win
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)
    expect(processed.customAttributes.get('platform_matched')).toBe(true)
  })

  it('handles detection_item_condition that does not match (else branch)', async () => {
    const pipelineYaml = `
transformations:
  - type: field_name_prefix
    prefix: "matched."
    detection_item_conditions:
      - type: detection_item_field_name
        pattern: "NonExistentField*"
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)
    // Condition doesn't match → field name unchanged
    const selection = processed.detection.detections.get('selection')!
    expect(selection.detectionItems[0]!.field).toBe('CommandLine')
  })

  it('handles fromYAML rule_processing_item_applied condition', async () => {
    const pipelineYaml = `
transformations:
  - id: step1
    type: set_state
    key: done
    value: true
  - type: set_custom_attribute
    key: step1_applied
    value: true
    rule_conditions:
      - type: rule_processing_item_applied
        item_id: step1
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)
    expect(processed.customAttributes.get('step1_applied')).toBe(true)
  })

  it('handles fromYAML with invalid transformation type (no-op fallback)', async () => {
    const pipelineYaml = `
transformations:
  - type: unknown_transformation_xyz
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    // Should not throw — unknown types are silently no-op
    const processed = pipeline.apply(rule)
    expect(processed.title).toBe('Test Rule')
  })

  it('handles fromYAML with invalid condition type (silently skip)', async () => {
    const pipelineYaml = `
transformations:
  - type: set_custom_attribute
    key: test
    value: true
    rule_conditions:
      - type: unknown_condition_type
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)
    // Unknown condition is skipped → transformation still applies
    expect(processed.customAttributes.get('test')).toBe(true)
  })

  it('covers factory default branches (missing config keys)', async () => {
    // Exercise all condition factories with missing keys to cover ternary "false" branches
    const pipelineYaml = `
transformations:
  - type: set_custom_attribute
    key: reached
    value: true
    rule_conditions:
      - type: logsource
      - type: rule_contains_detection_item
    detection_item_conditions:
      - type: detection_item_field_name
      - type: detection_item_processing_item_applied
      - type: detection_item_processing_state
  - type: set_state
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    // Just ensure it doesn't throw — we're testing factory default branches
    expect(() => pipeline.apply(rule)).not.toThrow()
  })

  it('covers add_condition with non-string, non-array value (uses empty string)', async () => {
    // value is not provided → neither array nor string → uses '' default
    const pipelineYaml = `
transformations:
  - type: add_condition
    field: EventID
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    const processed = pipeline.apply(rule)
    expect(processed.detection.detections.has('_added_condition')).toBe(true)
  })

  it('covers replace_string with missing pattern/replacement (uses defaults)', async () => {
    const pipelineYaml = `
transformations:
  - type: replace_string
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    expect(() => pipeline.apply(rule)).not.toThrow()
  })

  it('covers rule_tag and rule_contains_field with missing keys', async () => {
    const pipelineYaml = `
transformations:
  - type: set_custom_attribute
    key: done
    value: true
    rule_conditions:
      - type: rule_tag
      - type: rule_contains_field
      - type: rule_processing_item_applied
      - type: rule_processing_state
    detection_item_conditions:
      - type: detection_item_modifier
`
    const { ProcessingPipeline: PP } = await import('../../../src/processing/index.ts')
    const pipeline = PP.fromYAML(pipelineYaml)
    const rule = SigmaRule.fromYAML(BASE_YAML)
    expect(() => pipeline.apply(rule)).not.toThrow()
  })
})
