import type { ProcessingCondition } from './base.js'
import { SigmaPipelineParseError } from '../../exceptions.js'

// Factory function that creates a condition from a YAML config dict.
// Using a factory approach avoids constructor typing issues with typed params.
export type ConditionFactory = (config: Record<string, unknown>) => ProcessingCondition

export const conditionRegistry = new Map<string, ConditionFactory>()

export function registerPipelineCondition(name: string, factory: ConditionFactory): void {
  conditionRegistry.set(name, factory)
}

export function getPipelineCondition(name: string): ConditionFactory {
  const factory = conditionRegistry.get(name)
  if (factory === undefined) {
    throw new SigmaPipelineParseError(`Unknown pipeline condition type: "${name}"`)
  }
  return factory
}
