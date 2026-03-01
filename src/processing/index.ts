import { registerPipelineCondition } from './conditions/registry.js'
import { registerTransformation } from './pipeline.js'
import { LogsourceCondition } from './conditions/logsource.js'
import { RuleTagCondition } from './conditions/rule-tag.js'
import { RuleContainsDetectionItemCondition } from './conditions/rule-contains-detection-item.js'
import { RuleContainsFieldCondition } from './conditions/rule-contains-field.js'
import { RuleProcessingItemAppliedCondition } from './conditions/rule-processing-item-applied.js'
import { RuleProcessingStateCondition } from './conditions/rule-processing-state.js'
import { DetectionItemFieldNameCondition } from './conditions/detection-item-field-name.js'
import { DetectionItemModifierCondition } from './conditions/detection-item-modifier.js'
import { DetectionItemProcessingItemAppliedCondition } from './conditions/detection-item-processing-item-applied.js'
import { DetectionItemProcessingStateCondition } from './conditions/detection-item-processing-state.js'
import { FieldMappingTransformation } from './transformations/field-mapping.js'
import {
  AddFieldnamePrefixTransformation,
  AddFieldnameSuffixTransformation,
  FieldPrefixMappingTransformation,
} from './transformations/field-name.js'
import { DropDetectionItemTransformation } from './transformations/drop-detection-item.js'
import { RuleFailureTransformation, DetectionItemFailureTransformation } from './transformations/failure.js'
import { ReplaceStringTransformation } from './transformations/replace-string.js'
import { SetStateTransformation } from './transformations/set-state.js'
import { SetCustomAttributeTransformation } from './transformations/set-custom-attribute.js'
import { AddConditionTransformation } from './transformations/add-condition.js'
import { ChangeLogsourceTransformation } from './transformations/change-logsource.js'

export { ProcessingPipeline, ProcessingItem, registerPipeline, registerTransformation, transformationRegistry } from './pipeline.js'
export type { MutablePipelineState, TransformationFactory } from './pipeline.js'
export { ProcessingCondition } from './conditions/base.js'
export type { PipelineState } from './conditions/base.js'
export { ProcessingTransformation } from './transformations/base.js'
export { LogsourceCondition } from './conditions/logsource.js'
export { RuleTagCondition } from './conditions/rule-tag.js'
export { RuleContainsDetectionItemCondition } from './conditions/rule-contains-detection-item.js'
export { RuleContainsFieldCondition } from './conditions/rule-contains-field.js'
export { RuleProcessingItemAppliedCondition } from './conditions/rule-processing-item-applied.js'
export { RuleProcessingStateCondition } from './conditions/rule-processing-state.js'
export { DetectionItemFieldNameCondition } from './conditions/detection-item-field-name.js'
export { DetectionItemValueCondition } from './conditions/detection-item-value.js'
export { DetectionItemModifierCondition } from './conditions/detection-item-modifier.js'
export { DetectionItemProcessingItemAppliedCondition } from './conditions/detection-item-processing-item-applied.js'
export { DetectionItemProcessingStateCondition } from './conditions/detection-item-processing-state.js'
export {
  conditionRegistry,
  registerPipelineCondition,
  getPipelineCondition,
} from './conditions/registry.js'
export type { ConditionFactory } from './conditions/registry.js'
export { FieldMappingTransformation } from './transformations/field-mapping.js'
export {
  AddFieldnamePrefixTransformation,
  AddFieldnameSuffixTransformation,
  FieldPrefixMappingTransformation,
} from './transformations/field-name.js'
export { DropDetectionItemTransformation } from './transformations/drop-detection-item.js'
export { RuleFailureTransformation, DetectionItemFailureTransformation } from './transformations/failure.js'
export { ReplaceStringTransformation } from './transformations/replace-string.js'
export { SetStateTransformation } from './transformations/set-state.js'
export { SetCustomAttributeTransformation } from './transformations/set-custom-attribute.js'
export { AddConditionTransformation } from './transformations/add-condition.js'
export { ChangeLogsourceTransformation } from './transformations/change-logsource.js'

// Self-register all built-in conditions with their pySigma YAML type names.
registerPipelineCondition('logsource', (config) => {
  const category = typeof config['category'] === 'string' ? config['category'] : undefined
  const product = typeof config['product'] === 'string' ? config['product'] : undefined
  const service = typeof config['service'] === 'string' ? config['service'] : undefined
  return new LogsourceCondition({
    ...(category !== undefined ? { category } : {}),
    ...(product !== undefined ? { product } : {}),
    ...(service !== undefined ? { service } : {}),
  })
})

registerPipelineCondition('rule_tag', (config) =>
  new RuleTagCondition(typeof config['tag'] === 'string' ? config['tag'] : ''),
)

registerPipelineCondition('rule_contains_detection_item', (config) => {
  const sub = config['sub_conditions']
  if (Array.isArray(sub) && sub.length > 0) {
    throw new Error(
      '"sub_conditions" on rule_contains_detection_item is not yet supported — omit it to match any rule that contains at least one detection item',
    )
  }
  return new RuleContainsDetectionItemCondition([])
})

registerPipelineCondition('rule_contains_field', (config) =>
  new RuleContainsFieldCondition(typeof config['field'] === 'string' ? config['field'] : ''),
)

registerPipelineCondition('rule_processing_item_applied', (config) =>
  new RuleProcessingItemAppliedCondition(
    typeof config['item_id'] === 'string' ? config['item_id'] : '',
  ),
)

registerPipelineCondition(
  'rule_processing_state',
  (config) =>
    new RuleProcessingStateCondition(
      typeof config['key'] === 'string' ? config['key'] : '',
      config['value'],
    ),
)

registerPipelineCondition('detection_item_field_name', (config) =>
  new DetectionItemFieldNameCondition(
    typeof config['pattern'] === 'string' ? config['pattern'] : '*',
  ),
)

registerPipelineCondition('detection_item_value', (_config) => {
  throw new Error(
    '"detection_item_value" condition is not supported via YAML pipelines — construct DetectionItemValueCondition programmatically with a custom predicate',
  )
})

registerPipelineCondition('detection_item_modifier', (config) =>
  new DetectionItemModifierCondition(
    typeof config['modifier'] === 'string' ? config['modifier'] : '',
  ),
)

registerPipelineCondition('detection_item_processing_item_applied', (config) =>
  new DetectionItemProcessingItemAppliedCondition(
    typeof config['item_id'] === 'string' ? config['item_id'] : '',
  ),
)

registerPipelineCondition(
  'detection_item_processing_state',
  (config) =>
    new DetectionItemProcessingStateCondition(
      typeof config['key'] === 'string' ? config['key'] : '',
      config['value'],
    ),
)

// Self-register all built-in transformations with their pySigma YAML type names.
registerTransformation('field_name_mapping', (config) => {
  const mapping = config['mapping'] as Record<string, string | string[]> | undefined
  return new FieldMappingTransformation(mapping ?? {})
})

registerTransformation('field_name_prefix', (config) => {
  const prefix = typeof config['prefix'] === 'string' ? config['prefix'] : ''
  return new AddFieldnamePrefixTransformation(prefix)
})

registerTransformation('field_name_suffix', (config) => {
  const suffix = typeof config['suffix'] === 'string' ? config['suffix'] : ''
  return new AddFieldnameSuffixTransformation(suffix)
})

registerTransformation('field_name_prefix_mapping', (config) => {
  const mapping = config['mapping'] as Record<string, string> | undefined
  return new FieldPrefixMappingTransformation(mapping ?? {})
})

registerTransformation('drop_detection_item', (_config) => new DropDetectionItemTransformation())

registerTransformation('rule_failure', (config) => {
  const message = typeof config['message'] === 'string' ? config['message'] : 'Rule is not supported'
  return new RuleFailureTransformation(message)
})

registerTransformation('detection_item_failure', (config) => {
  const message = typeof config['message'] === 'string' ? config['message'] : 'Detection item is not supported'
  return new DetectionItemFailureTransformation(message)
})

registerTransformation('replace_string', (config) => {
  const pattern = typeof config['pattern'] === 'string' ? config['pattern'] : ''
  const replacement = typeof config['replacement'] === 'string' ? config['replacement'] : ''
  return new ReplaceStringTransformation(pattern, replacement)
})

registerTransformation('set_state', (config) => {
  const key = typeof config['key'] === 'string' ? config['key'] : ''
  return new SetStateTransformation(key, config['value'])
})

registerTransformation('set_custom_attribute', (config) => {
  const key = typeof config['key'] === 'string' ? config['key'] : ''
  return new SetCustomAttributeTransformation(key, config['value'])
})

registerTransformation('add_condition', (config) => {
  const field = typeof config['field'] === 'string' ? config['field'] : ''
  const value = config['value']
  const normalizedValue = Array.isArray(value)
    ? (value as string[])
    : typeof value === 'string'
      ? value
      : ''
  return new AddConditionTransformation(field, normalizedValue)
})

registerTransformation('change_logsource', (config) => {
  const params: { category?: string; product?: string; service?: string } = {}
  if (typeof config['category'] === 'string') params.category = config['category']
  if (typeof config['product'] === 'string') params.product = config['product']
  if (typeof config['service'] === 'string') params.service = config['service']
  return new ChangeLogsourceTransformation(params)
})
