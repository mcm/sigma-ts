import * as yaml from 'js-yaml'
import { SigmaRuleParseError } from './exceptions.js'
import { SigmaLogsource } from './logsource.js'
import { SigmaDetection } from './detection.js'
import { SigmaCondition } from './condition.js'

export type SigmaLevel = 'informational' | 'low' | 'medium' | 'high' | 'critical'
export type SigmaStatus = 'stable' | 'test' | 'experimental' | 'deprecated' | 'unsupported'

export interface SigmaRuleTag {
  readonly namespace: string
  readonly name: string
  readonly raw: string
}

export interface SigmaDetectionContainer {
  readonly detections: ReadonlyMap<string, SigmaDetection>
  readonly condition: readonly SigmaCondition[]
  readonly timeframe?: string
}

function parseTag(raw: string): SigmaRuleTag {
  const dotIdx = raw.indexOf('.')
  if (dotIdx <= 0) {
    return { namespace: raw, name: '', raw }
  }
  return {
    namespace: raw.slice(0, dotIdx),
    name: raw.slice(dotIdx + 1),
    raw,
  }
}

export class SigmaRule {
  readonly title: string
  readonly id: string | undefined
  readonly name: string | undefined
  readonly status: SigmaStatus | undefined
  readonly description: string | undefined
  readonly references: readonly string[]
  readonly author: string | undefined
  readonly date: string | undefined
  readonly modified: string | undefined
  readonly tags: readonly SigmaRuleTag[]
  readonly license: string | undefined
  readonly level: SigmaLevel | undefined
  readonly falsepositives: readonly string[]
  readonly related: readonly Record<string, string>[]
  readonly logsource: SigmaLogsource
  readonly detection: SigmaDetectionContainer
  readonly fields: readonly string[]
  readonly processingItemsApplied: ReadonlySet<string>
  readonly customAttributes: ReadonlyMap<string, unknown>

  constructor(params: {
    title: string
    id?: string
    name?: string
    status?: SigmaStatus
    description?: string
    references?: readonly string[]
    author?: string
    date?: string
    modified?: string
    tags?: readonly SigmaRuleTag[]
    license?: string
    level?: SigmaLevel
    falsepositives?: readonly string[]
    related?: readonly Record<string, string>[]
    logsource: SigmaLogsource
    detection: SigmaDetectionContainer
    fields?: readonly string[]
    processingItemsApplied?: ReadonlySet<string>
    customAttributes?: ReadonlyMap<string, unknown>
  }) {
    this.title = params.title
    this.id = params.id
    this.name = params.name
    this.status = params.status
    this.description = params.description
    this.references = params.references ?? []
    this.author = params.author
    this.date = params.date
    this.modified = params.modified
    this.tags = params.tags ?? []
    this.license = params.license
    this.level = params.level
    this.falsepositives = params.falsepositives ?? []
    this.related = params.related ?? []
    this.logsource = params.logsource
    this.detection = params.detection
    this.fields = params.fields ?? []
    this.processingItemsApplied = params.processingItemsApplied ?? new Set()
    this.customAttributes = params.customAttributes ?? new Map()
  }

  /**
   * Create a new SigmaRule with some fields overridden. Never mutates the original.
   */
  _clone(overrides: {
    logsource?: SigmaLogsource
    detection?: SigmaDetectionContainer
    processingItemsApplied?: ReadonlySet<string>
    customAttributes?: ReadonlyMap<string, unknown>
    title?: string
  } = {}): SigmaRule {
    type OptParams = {
      id?: string
      name?: string
      status?: SigmaStatus
      description?: string
      author?: string
      date?: string
      modified?: string
      license?: string
      level?: SigmaLevel
    }
    const optParams: OptParams = {}
    if (this.id !== undefined) optParams.id = this.id
    if (this.name !== undefined) optParams.name = this.name
    if (this.status !== undefined) optParams.status = this.status
    if (this.description !== undefined) optParams.description = this.description
    if (this.author !== undefined) optParams.author = this.author
    if (this.date !== undefined) optParams.date = this.date
    if (this.modified !== undefined) optParams.modified = this.modified
    if (this.license !== undefined) optParams.license = this.license
    if (this.level !== undefined) optParams.level = this.level

    return new SigmaRule({
      title: overrides.title ?? this.title,
      ...optParams,
      references: this.references,
      tags: this.tags,
      falsepositives: this.falsepositives,
      related: this.related,
      logsource: overrides.logsource ?? this.logsource,
      detection: overrides.detection ?? this.detection,
      fields: this.fields,
      processingItemsApplied: overrides.processingItemsApplied ?? this.processingItemsApplied,
      customAttributes: overrides.customAttributes ?? this.customAttributes,
    })
  }

  static fromYAML(yamlStr: string): SigmaRule {
    let parsed: unknown
    try {
      parsed = yaml.load(yamlStr)
    } catch (e) {
      throw new SigmaRuleParseError('Failed to parse YAML', { cause: e })
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new SigmaRuleParseError('YAML must be a mapping (object), not a list or scalar')
    }
    return SigmaRule.fromDict(parsed as Record<string, unknown>)
  }

  static fromDict(dict: Record<string, unknown>): SigmaRule {
    // Required fields
    if (typeof dict['title'] !== 'string' || dict['title'].length === 0) {
      throw new SigmaRuleParseError('Rule must have a non-empty "title" field')
    }

    const detectionRaw = dict['detection']
    if (typeof detectionRaw !== 'object' || detectionRaw === null || Array.isArray(detectionRaw)) {
      throw new SigmaRuleParseError('Rule must have a "detection" object')
    }
    const detectionDict = detectionRaw as Record<string, unknown>

    // Parse logsource
    const logsourceRaw = dict['logsource']
    let logsource: SigmaLogsource
    if (typeof logsourceRaw === 'object' && logsourceRaw !== null && !Array.isArray(logsourceRaw)) {
      logsource = SigmaLogsource.fromDict(logsourceRaw as Record<string, unknown>)
    } else {
      logsource = new SigmaLogsource({})
    }

    // Parse detections (skip condition and timeframe keys)
    const SKIP_KEYS = new Set(['condition', 'timeframe'])
    const detections = new Map<string, SigmaDetection>()
    for (const [key, value] of Object.entries(detectionDict)) {
      if (!SKIP_KEYS.has(key)) {
        try {
          detections.set(key, SigmaDetection.fromYAMLValue(value))
        } catch (e) {
          throw new SigmaRuleParseError(`Failed to parse detection "${key}"`, { cause: e })
        }
      }
    }

    // Parse condition(s)
    const conditionRaw = detectionDict['condition']
    const conditionStrings: string[] = []
    if (typeof conditionRaw === 'string') {
      conditionStrings.push(conditionRaw)
    } else if (Array.isArray(conditionRaw)) {
      for (const c of conditionRaw) {
        if (typeof c === 'string') conditionStrings.push(c)
      }
    } else {
      throw new SigmaRuleParseError('Detection must have a "condition" field')
    }

    const detectionNameSet = new Set(detections.keys())
    const conditions: SigmaCondition[] = []
    for (const condStr of conditionStrings) {
      try {
        conditions.push(SigmaCondition.parse(condStr, detectionNameSet))
      } catch (e) {
        throw new SigmaRuleParseError(`Failed to parse condition "${condStr}"`, { cause: e })
      }
    }

    // Parse timeframe
    const timeframe =
      typeof detectionDict['timeframe'] === 'string' ? detectionDict['timeframe'] : undefined

    const detectionContainer: SigmaDetectionContainer = {
      detections,
      condition: conditions,
      ...(timeframe !== undefined ? { timeframe } : {}),
    }

    // Parse tags
    const tagsRaw = dict['tags']
    const tags: SigmaRuleTag[] = []
    if (Array.isArray(tagsRaw)) {
      for (const t of tagsRaw) {
        if (typeof t === 'string') tags.push(parseTag(t))
      }
    }

    // Parse references
    const refsRaw = dict['references']
    const references: string[] = []
    if (Array.isArray(refsRaw)) {
      for (const r of refsRaw) {
        if (typeof r === 'string') references.push(r)
      }
    }

    // Parse falsepositives
    const fpRaw = dict['falsepositives']
    const falsepositives: string[] = []
    if (Array.isArray(fpRaw)) {
      for (const fp of fpRaw) {
        if (fp !== null && fp !== undefined) falsepositives.push(String(fp))
      }
    }

    // Parse related
    const relatedRaw = dict['related']
    const related: Record<string, string>[] = []
    if (Array.isArray(relatedRaw)) {
      for (const r of relatedRaw) {
        if (typeof r === 'object' && r !== null && !Array.isArray(r)) {
          const entry: Record<string, string> = {}
          for (const [k, v] of Object.entries(r as Record<string, unknown>)) {
            entry[k] = String(v)
          }
          related.push(entry)
        }
      }
    }

    // Parse fields list
    const fieldsRaw = dict['fields']
    const fields: string[] = []
    if (Array.isArray(fieldsRaw)) {
      for (const f of fieldsRaw) {
        if (typeof f === 'string') fields.push(f)
      }
    }

    // Build optional params conditionally (exactOptionalPropertyTypes)
    type OptParams = {
      id?: string
      name?: string
      status?: SigmaStatus
      description?: string
      author?: string
      date?: string
      modified?: string
      license?: string
      level?: SigmaLevel
    }
    const optParams: OptParams = {}

    const id = dict['id']
    if (typeof id === 'string') optParams.id = id

    const name = dict['name']
    if (typeof name === 'string') optParams.name = name

    const status = dict['status']
    const validStatuses: SigmaStatus[] = ['stable', 'test', 'experimental', 'deprecated', 'unsupported']
    if (typeof status === 'string' && validStatuses.includes(status as SigmaStatus)) {
      optParams.status = status as SigmaStatus
    }

    const description = dict['description']
    if (typeof description === 'string') optParams.description = description

    const author = dict['author']
    if (typeof author === 'string') optParams.author = author

    const date = dict['date']
    if (date !== undefined && date !== null) optParams.date = String(date)

    const modified = dict['modified']
    if (modified !== undefined && modified !== null) optParams.modified = String(modified)

    const license = dict['license']
    if (typeof license === 'string') optParams.license = license

    const level = dict['level']
    const validLevels: SigmaLevel[] = ['informational', 'low', 'medium', 'high', 'critical']
    if (typeof level === 'string' && validLevels.includes(level as SigmaLevel)) {
      optParams.level = level as SigmaLevel
    }

    return new SigmaRule({
      title: dict['title'],
      ...optParams,
      references,
      tags,
      falsepositives,
      related,
      logsource,
      detection: detectionContainer,
      fields,
    })
  }
}

