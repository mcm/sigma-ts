# sigma-ts Deep Audit Report (2026-03-01)

## Scope and method
- Scope: `src/**`, `tests/**`, project config and exports.
- Verification executed: `npm run typecheck`, `npm run lint`, `npm test` (all passed).
- Analysis tracks: security, optimization, and traceability.

## Architecture reality check
- UI layer: none found in this repository (no React/Vue/Svelte/DOM handlers).
- API/server layer: none (library package only).
- Persistence/DB layer: none.
- Effective layers in this repo:
  1. Public library entrypoints (`src/index.ts`, `src/core.ts`, `src/node/index.ts`)
  2. Parsing/model layer (`rule`, `detection`, `condition`, `types`, `modifiers`)
  3. Processing layer (`processing/*`)
  4. Validation layer (`validators/*`)
  5. Filesystem ingestion layer (`node/collection-loader.ts`)

## 1) Security findings

### Critical
- None identified.

### High
1. Silent pipeline downgrade to no-op transformation can bypass expected enforcement.
- Evidence: unknown/invalid transformation config falls back to `NoOpTransformation` without error in [src/processing/pipeline.ts](/home/coder/projects/sigma-ts/src/processing/pipeline.ts:142), [src/processing/pipeline.ts](/home/coder/projects/sigma-ts/src/processing/pipeline.ts:149), [src/processing/pipeline.ts](/home/coder/projects/sigma-ts/src/processing/pipeline.ts:151).
- Risk: a malformed or typoed transformation silently does nothing; downstream users may believe hardening or normalization ran when it did not.

2. Condition parsing failures are swallowed, resulting in unintended broad application.
- Evidence: condition parse errors are ignored in [src/processing/pipeline.ts](/home/coder/projects/sigma-ts/src/processing/pipeline.ts:36), [src/processing/pipeline.ts](/home/coder/projects/sigma-ts/src/processing/pipeline.ts:39).
- Risk: failed conditions become omitted conditions, which can broaden rule applicability and bypass intended guardrails.

3. `rule_contains_detection_item` ignores `sub_conditions` at registration time.
- Evidence: registration discards config and always builds empty `subConditions` in [src/processing/index.ts](/home/coder/projects/sigma-ts/src/processing/index.ts:80), [src/processing/index.ts](/home/coder/projects/sigma-ts/src/processing/index.ts:83).
- Amplifier: empty `subConditions` means `.every(...)` vacuously true in [src/processing/conditions/rule-contains-detection-item.ts](/home/coder/projects/sigma-ts/src/processing/conditions/rule-contains-detection-item.ts:15).
- Risk: policies intended to be narrowly scoped may match almost all rules with detection items.

### Medium
1. User-controlled regex patterns are executed with limited safeguards.
- Evidence: dynamic regex compilation in [src/processing/transformations/replace-string.ts](/home/coder/projects/sigma-ts/src/processing/transformations/replace-string.ts:25) and [src/types/sigma-regex.ts](/home/coder/projects/sigma-ts/src/types/sigma-regex.ts:35).
- Risk: catastrophic backtracking/ReDoS remains possible despite length limits.

2. Unbounded ingestion can cause resource exhaustion.
- Evidence: recursive scan + full-file reads + full YAML stream parse in [src/node/collection-loader.ts](/home/coder/projects/sigma-ts/src/node/collection-loader.ts:22), [src/node/collection-loader.ts](/home/coder/projects/sigma-ts/src/node/collection-loader.ts:78), [src/collection.ts](/home/coder/projects/sigma-ts/src/collection.ts:88).
- Risk: very large directories/files/docs can consume CPU/memory.

3. `detection_item_value` YAML condition is effectively disabled.
- Evidence: always-false predicate registration in [src/processing/index.ts](/home/coder/projects/sigma-ts/src/processing/index.ts:112), [src/processing/index.ts](/home/coder/projects/sigma-ts/src/processing/index.ts:115).
- Risk: conditions assumed active are silently inoperative.

### Low
1. Partial `change_logsource` update drops existing logsource fields.
- Evidence: full replacement in [src/processing/transformations/change-logsource.ts](/home/coder/projects/sigma-ts/src/processing/transformations/change-logsource.ts:16).
- Risk: unintended metadata loss may weaken downstream matching/controls.

2. Glob-to-regex logic duplicated in two places.
- Evidence: [src/processing/conditions/detection-item-field-name.ts](/home/coder/projects/sigma-ts/src/processing/conditions/detection-item-field-name.ts:6), [src/condition.ts](/home/coder/projects/sigma-ts/src/condition.ts:371).
- Risk: behavioral drift and inconsistent matching edge cases.

## 2) Optimization findings

1. Duplicate/uniqueness validators are O(n^2).
- Evidence: full-collection scans per rule in [src/validators/identifier-uniqueness.ts](/home/coder/projects/sigma-ts/src/validators/identifier-uniqueness.ts:9), [src/validators/duplicate-title.ts](/home/coder/projects/sigma-ts/src/validators/duplicate-title.ts:24), [src/validators/duplicate-filename.ts](/home/coder/projects/sigma-ts/src/validators/duplicate-filename.ts:40).
- Improvement: precompute frequency maps once per collection.

2. Pipeline applies eager per-item map cloning, even for no-op transforms.
- Evidence: per-item map copy loop in [src/processing/pipeline.ts](/home/coder/projects/sigma-ts/src/processing/pipeline.ts:181).
- Improvement: short-circuit no-op transformations and/or lazily allocate only on first mutation.

3. Unused internal state: `SigmaDetectionItem.comparison` is written but not consumed.
- Evidence: set in [src/detection.ts](/home/coder/projects/sigma-ts/src/detection.ts:83), [src/detection.ts](/home/coder/projects/sigma-ts/src/detection.ts:107); no downstream reads across `src/**`.
- Improvement: either implement downstream use or remove to reduce cognitive load and branching.

4. Minor redundancy in constructor logic.
- Evidence: redundant ternary in [src/processing/transformations/add-condition.ts](/home/coder/projects/sigma-ts/src/processing/transformations/add-condition.ts:10).

## 3) Traceability audit (layer-by-layer)

## UI -> code trace
- No UI code exists in repository, so there are no buttons/links to trace.

## Public entrypoints -> internal flows
1. `SigmaRule.fromYAML(yamlStr: string): SigmaRule`
- Entry: [src/rule.ts](/home/coder/projects/sigma-ts/src/rule.ts:144)
- Flow: YAML parse -> `fromDict` -> `SigmaLogsource.fromDict` -> `SigmaDetection.fromYAMLValue` -> `SigmaCondition.parse`.
- Signature consistency: correct types and return contract.

2. `SigmaCollection.fromYAML(yamlStr: string): SigmaCollection`
- Entry: [src/collection.ts](/home/coder/projects/sigma-ts/src/collection.ts:82)
- Flow: `yaml.loadAll` docs -> per-doc `SigmaRule.fromDict` -> collect errors.
- Signature consistency: correct.

3. `loadRulesFromDirectory(dir: string, options?: LoadOptions): Promise<SigmaCollection>`
- Entry: [src/node/collection-loader.ts](/home/coder/projects/sigma-ts/src/node/collection-loader.ts:62)
- Flow: recursive file collection -> `readFile` -> `SigmaRule.fromYAML` -> attach `filename` custom attribute.
- Signature consistency: correct.

4. `ProcessingPipeline.fromYAML(yamlStr: string): ProcessingPipeline`
- Entry: [src/processing/pipeline.ts](/home/coder/projects/sigma-ts/src/processing/pipeline.ts:113)
- Flow: parse item configs -> condition registry -> transformation registry -> pipeline items.
- Traceability issues: silent condition drop, no-op transformation fallback, and unsupported-yet-registered conditions (above).

5. `ProcessingPipeline.apply(rule: SigmaRule): SigmaRule`
- Entry: [src/processing/pipeline.ts](/home/coder/projects/sigma-ts/src/processing/pipeline.ts:172)
- Flow: rule conditions -> detection-item conditions -> item transform -> rule transform -> applied item bookkeeping.
- Signature consistency: correct.

## Code -> DB trace
- No DB integration in this repository; terminal layer is in-memory objects plus optional filesystem reads.

## Key correctness mismatches discovered in traceability pass
1. `rule_contains_detection_item` config contract vs implementation mismatch.
2. `detection_item_value` YAML contract vs implementation mismatch.
3. `change_logsource` partial-update expectation vs full-replace implementation mismatch.

## Summary
- Test/lint/typecheck are green, but there are design-level risks that can hide pipeline misconfiguration.
- Biggest practical issues are silent failure semantics and condition-contract mismatches.
- No UI/DB path exists here; traceability is complete for this library’s real layers.
