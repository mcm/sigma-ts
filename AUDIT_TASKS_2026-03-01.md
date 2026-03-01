# sigma-ts Audit Task Board (2026-03-01)

## Usage
- Pick one unchecked task.
- Follow the scope and acceptance criteria exactly.
- Keep changes minimal and add tests first where practical.

## P0 - Security/Correctness

- [ ] TSK-SEC-001 Harden `ProcessingPipeline.fromYAML` against silent no-op fallbacks
  - Owner profile: `agent-security-pipeline`
  - Scope: [src/processing/pipeline.ts](/home/coder/projects/sigma-ts/src/processing/pipeline.ts:113)
  - Work:
    1. Replace silent condition-skip behavior with structured parse errors.
    2. Replace no-op transformation fallback on invalid config/type with error.
    3. Return/throw deterministic parse diagnostics.
  - Acceptance criteria:
    1. Invalid condition type fails loudly.
    2. Invalid transformation type/config fails loudly.
    3. Unit tests cover both paths.

- [ ] TSK-SEC-002 Implement `rule_contains_detection_item.sub_conditions` parsing
  - Owner profile: `agent-trace-conditions`
  - Scope: [src/processing/index.ts](/home/coder/projects/sigma-ts/src/processing/index.ts:80), [src/processing/conditions/rule-contains-detection-item.ts](/home/coder/projects/sigma-ts/src/processing/conditions/rule-contains-detection-item.ts:6)
  - Work:
    1. Parse nested `sub_conditions` recursively.
    2. Validate nested condition schemas.
    3. Reject malformed nested definitions.
  - Acceptance criteria:
    1. Condition behavior matches YAML definition.
    2. Empty `sub_conditions` semantics are explicit and tested.

- [ ] TSK-SEC-003 Implement real YAML-backed `detection_item_value` behavior
  - Owner profile: `agent-trace-conditions`
  - Scope: [src/processing/index.ts](/home/coder/projects/sigma-ts/src/processing/index.ts:112), [src/processing/conditions/detection-item-value.ts](/home/coder/projects/sigma-ts/src/processing/conditions/detection-item-value.ts:7)
  - Work:
    1. Define a config schema (exact/pattern/operator).
    2. Build predicate from YAML config.
    3. Add positive and negative tests.
  - Acceptance criteria:
    1. YAML condition can evaluate true when expected.
    2. Unsupported config fails explicitly.

## P1 - Security Hardening

- [ ] TSK-SEC-004 Add regex safety controls for user-provided patterns
  - Owner profile: `agent-security-regex`
  - Scope: [src/processing/transformations/replace-string.ts](/home/coder/projects/sigma-ts/src/processing/transformations/replace-string.ts:15), [src/types/sigma-regex.ts](/home/coder/projects/sigma-ts/src/types/sigma-regex.ts:13)
  - Work:
    1. Add configurable regex policy (length, feature guardrails, timeout strategy if feasible).
    2. Add tests for catastrophic-pattern rejection behavior.
  - Acceptance criteria:
    1. Known problematic patterns are rejected or safely handled.
    2. Existing valid regex behavior remains compatible.

- [ ] TSK-SEC-005 Add ingestion limits for filesystem and YAML parsing
  - Owner profile: `agent-security-io`
  - Scope: [src/node/collection-loader.ts](/home/coder/projects/sigma-ts/src/node/collection-loader.ts:22), [src/collection.ts](/home/coder/projects/sigma-ts/src/collection.ts:82)
  - Work:
    1. Add options for max files, max file size, max YAML documents.
    2. Fail deterministically when limits are exceeded.
  - Acceptance criteria:
    1. Limit-exceeded errors are explicit and test-covered.
    2. Default behavior remains backward compatible.

## P1 - Traceability/Behavior

- [ ] TSK-TRC-001 Make `change_logsource` a merge, not blind replacement
  - Owner profile: `agent-trace-transformations`
  - Scope: [src/processing/transformations/change-logsource.ts](/home/coder/projects/sigma-ts/src/processing/transformations/change-logsource.ts:15)
  - Work:
    1. Preserve original `logsource` fields unless explicitly overridden.
    2. Preserve custom logsource metadata.
  - Acceptance criteria:
    1. Partial update modifies only specified keys.
    2. Regression tests added.

## P2 - Optimization

- [ ] TSK-OPT-001 Replace O(n^2) duplicate validators with precomputed indexes
  - Owner profile: `agent-perf-validators`
  - Scope: [src/validators/identifier-uniqueness.ts](/home/coder/projects/sigma-ts/src/validators/identifier-uniqueness.ts:7), [src/validators/duplicate-title.ts](/home/coder/projects/sigma-ts/src/validators/duplicate-title.ts:22), [src/validators/duplicate-filename.ts](/home/coder/projects/sigma-ts/src/validators/duplicate-filename.ts:37)
  - Work:
    1. Build a collection-level index map once.
    2. Reuse for all rules.
  - Acceptance criteria:
    1. Validator output unchanged.
    2. Complexity reduced to near O(n).

- [ ] TSK-OPT-002 Reduce pipeline allocation churn
  - Owner profile: `agent-perf-pipeline`
  - Scope: [src/processing/pipeline.ts](/home/coder/projects/sigma-ts/src/processing/pipeline.ts:181)
  - Work:
    1. Avoid eager map/array cloning for known no-op paths.
    2. Clone only after first mutation.
  - Acceptance criteria:
    1. Behavior unchanged.
    2. Micro-benchmark shows fewer allocations for no-op pipelines.

- [ ] TSK-OPT-003 Consolidate duplicated glob matcher implementation
  - Owner profile: `agent-refactor-core`
  - Scope: [src/processing/conditions/detection-item-field-name.ts](/home/coder/projects/sigma-ts/src/processing/conditions/detection-item-field-name.ts:6), [src/condition.ts](/home/coder/projects/sigma-ts/src/condition.ts:371)
  - Work:
    1. Extract shared utility.
    2. Align case-sensitivity behavior intentionally.
  - Acceptance criteria:
    1. Single implementation used in both sites.
    2. Existing tests pass with any intentional behavior changes documented.

- [ ] TSK-OPT-004 Decide fate of `SigmaDetectionItem.comparison`
  - Owner profile: `agent-refactor-core`
  - Scope: [src/detection.ts](/home/coder/projects/sigma-ts/src/detection.ts:18)
  - Work:
    1. Either implement downstream usage or remove field and related branching.
  - Acceptance criteria:
    1. No dead state remains.
    2. Tests updated to match chosen direction.

## Recommended execution order
1. `TSK-SEC-001`
2. `TSK-SEC-002`
3. `TSK-SEC-003`
4. `TSK-TRC-001`
5. `TSK-SEC-004`
6. `TSK-SEC-005`
7. `TSK-OPT-001`
8. `TSK-OPT-002`
9. `TSK-OPT-003`
10. `TSK-OPT-004`
