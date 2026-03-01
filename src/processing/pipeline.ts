import * as yaml from 'js-yaml'
import { SigmaPipelineParseError, SigmaPluginError } from '../exceptions.js'
import type { SigmaRule } from '../rule.js'
import { SigmaCollection } from '../collection.js'
import type { PipelineState, ProcessingCondition } from './conditions/base.js'
import { ProcessingTransformation } from './transformations/base.js'
import type { SigmaDetectionItem } from '../detection.js'
import { getPipelineCondition } from './conditions/registry.js'


/**
 * Parse an array of raw condition config objects from YAML using the condition registry.
 * Throws SigmaPipelineParseError for missing or unknown condition types.
 */
function parseConditionList(raw: unknown): ProcessingCondition[] {
  if (!Array.isArray(raw)) return []
  const conditions: ProcessingCondition[] = []
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) continue
    const cfg = entry as Record<string, unknown>
    const typeName = typeof cfg['type'] === 'string' ? cfg['type'] : undefined
    if (typeName === undefined) {
      throw new SigmaPipelineParseError('Pipeline condition entry is missing required "type" field')
    }
    const factory = getPipelineCondition(typeName)
    conditions.push(factory(cfg))
  }
  return conditions
}

export interface MutablePipelineState {
  appliedItems: Set<string>
  customState: Map<string, unknown>
}

function createState(): MutablePipelineState {
  return { appliedItems: new Set(), customState: new Map() }
}

export class ProcessingItem {
  readonly id: string | undefined
  readonly transformation: ProcessingTransformation
  readonly ruleConditions: readonly ProcessingCondition[]
  readonly detectionItemConditions: readonly ProcessingCondition[]

  constructor(params: {
    id?: string
    transformation: ProcessingTransformation
    ruleConditions?: readonly ProcessingCondition[]
    detectionItemConditions?: readonly ProcessingCondition[]
  }) {
    this.id = params.id
    this.transformation = params.transformation
    this.ruleConditions = params.ruleConditions ?? []
    this.detectionItemConditions = params.detectionItemConditions ?? []
  }

  appliesToRule(rule: SigmaRule, state: PipelineState): boolean {
    return this.ruleConditions.every((c) => c.matchesRule(rule, state))
  }

  appliesToDetectionItem(item: SigmaDetectionItem, state: PipelineState): boolean {
    return this.detectionItemConditions.every((c) => c.matchesDetectionItem(item, state))
  }
}

const pipelineRegistry = new Map<string, ProcessingPipeline>()

export function registerPipeline(name: string, pipeline: ProcessingPipeline): void {
  pipelineRegistry.set(name, pipeline)
}

export class ProcessingPipeline {
  readonly name: string | undefined
  readonly items: readonly ProcessingItem[]

  constructor(params: { name?: string; items?: readonly ProcessingItem[] } = {}) {
    this.name = params.name
    this.items = params.items ?? []
  }

  static fromName(name: string): ProcessingPipeline {
    const pipeline = pipelineRegistry.get(name)
    if (pipeline === undefined) {
      throw new SigmaPluginError(`Unknown pipeline name: "${name}"`)
    }
    return pipeline
  }

  static merge(pipelines: readonly ProcessingPipeline[]): ProcessingPipeline {
    const items: ProcessingItem[] = []
    for (const p of pipelines) {
      items.push(...p.items)
    }
    return new ProcessingPipeline({ items })
  }

  static fromYAML(yamlStr: string): ProcessingPipeline {
    let parsed: unknown
    try {
      parsed = yaml.load(yamlStr)
    } catch (e) {
      throw new SigmaPipelineParseError('Failed to parse pipeline YAML', { cause: e })
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new SigmaPipelineParseError('Pipeline YAML must be a mapping')
    }
    const dict = parsed as Record<string, unknown>
    const name = typeof dict['name'] === 'string' ? dict['name'] : undefined
    const params: { name?: string; items: ProcessingItem[] } = { items: [] }
    if (name !== undefined) params.name = name

    // Parse transformations array — condition deserialization uses the condition registry.
    // Transformation deserialization uses the transformation registry.
    const rawTransformations = dict['transformations']
    if (Array.isArray(rawTransformations)) {
      for (const rawItem of rawTransformations) {
        if (typeof rawItem !== 'object' || rawItem === null || Array.isArray(rawItem)) {
          continue
        }
        const itemDict = rawItem as Record<string, unknown>
        const itemId = typeof itemDict['id'] === 'string' ? itemDict['id'] : undefined

        const ruleConditions = parseConditionList(itemDict['rule_conditions'])
        const detectionItemConditions = parseConditionList(itemDict['detection_item_conditions'])

        const typeName = typeof itemDict['type'] === 'string' ? itemDict['type'] : undefined
        if (typeName === undefined) {
          throw new SigmaPipelineParseError('Pipeline transformation entry is missing required "type" field')
        }
        const factory = transformationRegistry.get(typeName)
        if (factory === undefined) {
          throw new SigmaPipelineParseError(`Unknown transformation type: "${typeName}"`)
        }
        const transformation = factory(itemDict)

        const item = new ProcessingItem({
          ...(itemId !== undefined ? { id: itemId } : {}),
          transformation,
          ruleConditions,
          detectionItemConditions,
        })
        params.items.push(item)
      }
    }

    return new ProcessingPipeline(params)
  }

  /**
   * Apply pipeline to a single rule.
   */
  apply(rule: SigmaRule): SigmaRule {
    const state: MutablePipelineState = createState()
    let currentRule = rule

    for (const item of this.items) {
      // Check rule-level conditions
      if (!item.appliesToRule(currentRule, state)) continue

      // Apply transformation to each detection item first (detection-item-level)
      const newDetections = new Map(currentRule.detection.detections)
      let detectionChanged = false

      for (const [name, detection] of newDetections) {
        const newItems: SigmaDetectionItem[] = []
        let itemsChanged = false
        for (const detItem of detection.detectionItems) {
          if (item.appliesToDetectionItem(detItem, state)) {
            const transformed = item.transformation.applyToDetectionItem(detItem, state)
            newItems.push(...transformed)
            if (transformed.length !== 1 || transformed[0] !== detItem) {
              itemsChanged = true
            }
          } else {
            newItems.push(detItem)
          }
        }
        if (itemsChanged) {
          newDetections.set(name, detection._clone(newItems))
          detectionChanged = true
        }
      }

      if (detectionChanged) {
        currentRule = currentRule._clone({
          detection: { ...currentRule.detection, detections: newDetections },
        })
      }

      // Apply rule-level transformation
      currentRule = item.transformation.applyToRule(currentRule, state)

      // Track that this item was applied
      if (item.id !== undefined) {
        state.appliedItems.add(item.id)
      }
    }

    // Persist the applied items set onto the returned rule
    if (state.appliedItems.size > 0) {
      const newApplied = new Set([...rule.processingItemsApplied, ...state.appliedItems])
      currentRule = currentRule._clone({ processingItemsApplied: newApplied })
    }

    return currentRule
  }

  applyCollection(collection: SigmaCollection): SigmaCollection {
    const rules = [...collection.rules].map((rule) => this.apply(rule))
    return new SigmaCollection(rules, [...collection.errors])
  }
}

// ---- Transformation registry ----

export type TransformationFactory = (config: Record<string, unknown>) => ProcessingTransformation

export const transformationRegistry = new Map<string, TransformationFactory>()

export function registerTransformation(name: string, factory: TransformationFactory): void {
  transformationRegistry.set(name, factory)
}
