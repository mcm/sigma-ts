# sigma-ts

A fully-typed TypeScript implementation of the [Sigma](https://sigmahq.io/) rule processing model, achieving feature parity with [pySigma](https://github.com/SigmaHQ/pySigma).

## Installation

```bash
npm install sigma-ts
```

Requires Node.js 20 or later.

## Entry Points

`sigma-ts` ships three sub-path exports:

| Import path | Contents | Browser-safe |
|---|---|---|
| `sigma-ts` | Full library: parsers, types, pipeline, validators | No |
| `sigma-ts/core` | Rule parser, value types, collection (no pipeline or validators) | Yes |
| `sigma-ts/node` | Node.js filesystem helpers (`loadRulesFromDirectory`) | No |

## Basic Usage

### Parse a Sigma rule

```typescript
import { SigmaRule } from 'sigma-ts'

const yaml = `
title: Suspicious PowerShell
id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
status: test
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    CommandLine|contains: '-EncodedCommand'
  condition: selection
level: medium
`

const rule = SigmaRule.fromYAML(yaml)
console.log(rule.title)               // "Suspicious PowerShell"
console.log(rule.level)               // "medium"
console.log(rule.logsource.category)  // "process_creation"
console.log(rule.id)                  // "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
console.log(rule.status)              // "test"
```

### Load a collection of rules

```typescript
import { SigmaCollection } from 'sigma-ts'

// Parse a multi-document YAML stream (--- separated documents)
const collection = SigmaCollection.fromYAML(multiDocYaml)
console.log(`Loaded ${collection.count} rules with ${collection.errorCount} errors`)

// Inspect parse errors without throwing
for (const err of collection.errors) {
  console.warn(`${err.source}: ${err.error.message}`)
}

// Iterate
for (const rule of collection) {
  console.log(rule.title)
}

// Filter by level, tag, logsource, or status
const windowsRules = collection.filterByLogsource({ product: 'windows' })
const highSeverity = collection.filterByLevel('high')
const attackRules = collection.filterByTag('attack.execution')
const stableRules = collection.filterByStatus('stable')

// Arbitrary filter
const namedRules = collection.filter(r => r.author === 'alice')

// Access by index
const firstRule = collection.get(0)
```

### Load rules from the filesystem

```typescript
import { loadRulesFromDirectory } from 'sigma-ts/node'

const collection = await loadRulesFromDirectory('./rules', {
  recursive: true,          // default: true — traverse subdirectories
  extensions: ['.yml', '.yaml'],  // default: ['.yml', '.yaml']
  errorHandling: 'collect', // default: 'collect' — accumulate errors; use 'throw' to fail fast
})

console.log(`Loaded ${collection.count} rules`)

// The source filename is stored in customAttributes
for (const rule of collection) {
  console.log(rule.customAttributes.get('filename'))
}
```

### Apply a processing pipeline

```typescript
import { SigmaRule, ProcessingPipeline } from 'sigma-ts'

const pipelineYaml = `
name: windows-field-rename
transformations:
  - id: rename_computername
    type: field_name_mapping
    mapping:
      ComputerName: hostname
  - id: add_os_prefix
    type: field_name_prefix
    prefix: 'win.'
    rule_conditions:
      - type: logsource
        product: windows
`

const pipeline = ProcessingPipeline.fromYAML(pipelineYaml)

// Apply to a single rule
const transformed = pipeline.apply(rule)

// Apply to all rules in a collection
const transformedCollection = collection.applyPipeline(pipeline)
// or equivalently:
const transformedCollection2 = pipeline.applyCollection(collection)
```

### Validate rules

```typescript
import {
  SigmaCollectionValidator,
  IdentifierExistsValidator,
  IdentifierUniquenessValidator,
  TitleLengthValidator,
  ATTACKTagValidator,
  LevelExistsValidator,
  StatusExistsValidator,
  DateExistsValidator,
  DescriptionExistsValidator,
  FalsePositivesExistsValidator,
} from 'sigma-ts'

const validator = new SigmaCollectionValidator([
  new IdentifierExistsValidator(),
  new IdentifierUniquenessValidator(),
  new TitleLengthValidator(),
  new ATTACKTagValidator(),
  new LevelExistsValidator(),
  new StatusExistsValidator(),
])

const issues = validator.validate(collection)
for (const issue of issues) {
  console.log(`[${issue.severity}] ${issue.rule.title}: ${issue.message}`)
}
// severity is 'error' | 'warning' | 'informational'
```

### Core-only (browser-compatible) import

```typescript
import { SigmaRule, SigmaCollection } from 'sigma-ts/core'
// No Node.js APIs, no pipeline, no validators — safe for browser/edge runtimes
```

## API Reference

### `SigmaRule`

| Property / Method | Type | Description |
|---|---|---|
| `SigmaRule.fromYAML(yaml)` | static | Parse a single rule from a YAML string |
| `SigmaRule.fromDict(dict)` | static | Parse from a plain object |
| `rule.title` | `string` | Rule title (required) |
| `rule.id` | `string \| undefined` | Optional UUID |
| `rule.name` | `string \| undefined` | Optional machine-readable name |
| `rule.status` | `SigmaStatus \| undefined` | `'stable' \| 'test' \| 'experimental' \| 'deprecated' \| 'unsupported'` |
| `rule.description` | `string \| undefined` | Human-readable description |
| `rule.author` | `string \| undefined` | Rule author |
| `rule.date` | `string \| undefined` | Creation date |
| `rule.modified` | `string \| undefined` | Last modified date |
| `rule.license` | `string \| undefined` | SPDX license identifier |
| `rule.references` | `readonly string[]` | Reference URLs |
| `rule.tags` | `readonly SigmaRuleTag[]` | Tags with `namespace`, `name`, and `raw` fields |
| `rule.level` | `SigmaLevel \| undefined` | `'informational' \| 'low' \| 'medium' \| 'high' \| 'critical'` |
| `rule.falsepositives` | `readonly string[]` | Known false positive descriptions |
| `rule.logsource` | `SigmaLogsource` | Log source with `category`, `product`, `service` fields |
| `rule.detection` | `SigmaDetectionContainer` | Parsed detections and conditions |
| `rule.fields` | `readonly string[]` | Interesting field names |
| `rule.processingItemsApplied` | `ReadonlySet<string>` | IDs of pipeline items that have been applied |
| `rule.customAttributes` | `ReadonlyMap<string, unknown>` | Extension metadata (e.g. `filename` set by `loadRulesFromDirectory`) |

### `SigmaCollection`

| Method | Description |
|---|---|
| `SigmaCollection.fromYAML(yaml)` | Parse a multi-document YAML stream (separated by `---`) |
| `SigmaCollection.fromYAMLList(list)` | Parse an array of single-rule YAML strings |
| `collection.count` | Number of successfully parsed rules |
| `collection.errorCount` | Number of parse errors |
| `collection.errors` | Array of `{ source: string, error: SigmaError }` objects |
| `collection.get(index)` | Get a rule by index (throws `RangeError` if out of bounds) |
| `collection.filter(fn)` | Return a new `SigmaCollection` matching the predicate |
| `collection.filterByLogsource(ls)` | Filter by partial logsource (undefined fields match anything) |
| `collection.filterByTag(tag)` | Filter by tag string (matches `raw` or `name`) |
| `collection.filterByLevel(level)` | Filter by severity level |
| `collection.filterByStatus(status)` | Filter by rule status |
| `collection.applyPipeline(pipeline)` | Apply a processing pipeline to all rules |

### `loadRulesFromDirectory` (sigma-ts/node)

```typescript
loadRulesFromDirectory(dir: string, options?: LoadOptions): Promise<SigmaCollection>
```

| Option | Type | Default | Description |
|---|---|---|---|
| `recursive` | `boolean` | `true` | Traverse subdirectories |
| `extensions` | `string[]` | `['.yml', '.yaml']` | File extensions to include (case-insensitive) |
| `errorHandling` | `'collect' \| 'throw'` | `'collect'` | `'collect'` accumulates errors; `'throw'` throws on the first failure |

Files are processed in sorted order. On success, the source filename is stored on each rule at `rule.customAttributes.get('filename')`.

### `ProcessingPipeline`

| Method | Description |
|---|---|
| `ProcessingPipeline.fromYAML(yaml)` | Deserialise from a YAML pipeline definition |
| `ProcessingPipeline.fromName(name)` | Look up a registered pipeline by name |
| `ProcessingPipeline.merge(pipelines)` | Concatenate items from multiple pipelines into one |
| `pipeline.apply(rule)` | Apply pipeline to a single rule (returns new rule, never mutates) |
| `pipeline.applyCollection(coll)` | Apply pipeline to every rule in a collection |

#### Built-in transformation types (YAML `type` values)

| Type | Description |
|---|---|
| `field_name_mapping` | Rename fields using a `mapping` dict (one-to-many supported) |
| `field_name_prefix` | Prepend a `prefix` string to all field names |
| `field_name_suffix` | Append a `suffix` string to all field names |
| `field_name_prefix_mapping` | Rename fields whose prefix matches a `mapping` dict |
| `add_condition` | Inject an extra detection item with a fixed `field`/`value` |
| `change_logsource` | Override the rule's `category`, `product`, and/or `service` |
| `replace_string` | Replace a regex `pattern` in string values with a `replacement` |
| `set_state` | Set a pipeline state `key` to `value` for downstream conditions |
| `set_custom_attribute` | Set a `key`/`value` in `rule.customAttributes` |
| `drop_detection_item` | Remove matched detection items entirely |
| `rule_failure` | Throw a `SigmaTransformationError` with a custom `message` |
| `detection_item_failure` | Throw a `SigmaTransformationError` for matched detection items |

#### Built-in condition types (YAML `type` values for `rule_conditions` / `detection_item_conditions`)

| Type | Scope | Description |
|---|---|---|
| `logsource` | rule | Matches rules with a specific `category`, `product`, and/or `service` |
| `rule_tag` | rule | Matches rules that carry a specific `tag` |
| `rule_contains_field` | rule | Matches rules whose detections reference a specific `field` |
| `rule_contains_detection_item` | rule | Matches rules containing specific detection items |
| `rule_processing_item_applied` | rule | Matches rules where a pipeline item with `item_id` was applied |
| `rule_processing_state` | rule | Matches when pipeline state `key` equals `value` |
| `detection_item_field_name` | detection item | Matches detection items whose field name matches a glob `pattern` |
| `detection_item_value` | detection item | Matches detection items by a value predicate |
| `detection_item_modifier` | detection item | Matches detection items that use a specific `modifier` |
| `detection_item_processing_item_applied` | detection item | Matches detection items where a pipeline item with `item_id` was applied |
| `detection_item_processing_state` | detection item | Matches when pipeline state `key` equals `value` |

### Built-in Validators

All validators implement `SigmaValidator` and can be composed with `SigmaCollectionValidator`.

| Class | What it checks |
|---|---|
| `IdentifierExistsValidator` | Rule has an `id` field |
| `IdentifierUniquenessValidator` | All rule IDs in the collection are unique |
| `TitleLengthValidator` | Title is no longer than 256 characters |
| `DuplicateTitleValidator` | No two rules share the same title |
| `DuplicateFilenameValidator` | No two rules share the same `filename` custom attribute |
| `TagValidator` | All tags follow the `namespace.name` format |
| `ATTACKTagValidator` | Tags in the `attack` namespace reference valid MITRE ATT&CK IDs |
| `SigmaTagValidator` | Tags in the `sigma` namespace reference known Sigma standard tags |
| `StatusExistsValidator` | Rule has a `status` field |
| `DateExistsValidator` | Rule has a `date` field |
| `DescriptionExistsValidator` | Rule has a `description` field |
| `FalsePositivesExistsValidator` | Rule has a `falsepositives` field |
| `LevelExistsValidator` | Rule has a `level` field |
| `AllOfThemConditionValidator` | Flags use of `all of them` which can produce unexpected results |
| `TimespanConditionValidator` | Detection defines a `timeframe` field |
| `WildcardsInsteadOfContainsValidator` | Flags values that use wildcards where a `contains` modifier would be cleaner |

### Field Modifiers

Detection fields support the following built-in modifiers (pipe-separated after the field name):

| Modifier | Description |
|---|---|
| `contains` | Value is a substring match |
| `startswith` | Value matches the start of the field |
| `endswith` | Value matches the end of the field |
| `re` | Value is a regular expression |
| `cidr` | Value is a CIDR network address |
| `base64` | Encode value as Base64 before matching |
| `base64offset` | Apply all three Base64 offset variants |
| `wide` | Encode value as UTF-16 LE before matching |
| `utf16le` | Encode as UTF-16 LE |
| `utf16be` | Encode as UTF-16 BE |
| `utf16` | Encode as UTF-16 (both LE and BE variants) |
| `windash` | Replace `-` with `/` for Windows command-line flag matching |
| `lt` | Field value is less than the given number |
| `lte` | Field value is less than or equal to the given number |
| `gt` | Field value is greater than the given number |
| `gte` | Field value is greater than or equal to the given number |
| `exists` | Field exists (value `true`) or does not exist (value `false`) |
| `fieldref` | Compare field value against another field's value |
| `expand` | Expand a variable placeholder from pipeline state |
| `all` | All listed values must match (default is OR) |

### Error Hierarchy

All errors extend `SigmaError`, which extends `Error`.

| Class | Thrown when |
|---|---|
| `SigmaError` | Base class — carries optional `source` and `cause` |
| `SigmaRuleParseError` | A rule's YAML or field structure is invalid |
| `SigmaDetectionParseError` | A detection block cannot be parsed |
| `SigmaConditionError` | A condition expression has a syntax error |
| `SigmaModifierError` | An unknown or invalid modifier is used |
| `SigmaTypeError` | A value has the wrong type for its context |
| `SigmaTransformationError` | A pipeline transformation explicitly fails a rule |
| `SigmaPipelineParseError` | A pipeline YAML definition is invalid |
| `SigmaValidationError` | A validator encounters an unrecoverable error |
| `SigmaPluginError` | A named pipeline is not registered |

## Plugin Packages

Third-party pipeline packages can self-register via `registerPipeline` so callers look them up by name. Plugin packages must set `"sideEffects": true` in their `package.json` to prevent bundlers from tree-shaking the registration call:

```json
{
  "name": "sigma-pipeline-my-siem",
  "sideEffects": true
}
```

Import the plugin package before calling `ProcessingPipeline.fromName()`:

```typescript
import 'sigma-pipeline-my-siem'
import { ProcessingPipeline } from 'sigma-ts'

const pipeline = ProcessingPipeline.fromName('my-siem')
```

Custom transformations and pipeline conditions can also be registered at runtime:

```typescript
import { registerTransformation, registerPipeline, ProcessingPipeline, ProcessingItem } from 'sigma-ts'
import { MyTransformation } from './my-transformation.js'

registerTransformation('my_transform', (config) => new MyTransformation(config))

registerPipeline('my-siem', new ProcessingPipeline({
  name: 'my-siem',
  items: [
    new ProcessingItem({ transformation: new MyTransformation({}) }),
  ],
}))
```

## Security considerations

### Regex patterns

`SigmaRegularExpression` (used by the `|re` modifier) and `ReplaceStringTransformation` both compile user-supplied regex patterns using the JavaScript engine. A length limit of 2,000 characters is enforced to reduce exposure, but length alone does not prevent catastrophic backtracking (ReDoS). Short patterns such as `(a+)+b` can still cause exponential backtracking on adversarial input.

**Recommendation**: this library is designed to process rules from trusted sources (your own rule repository, SigmaHQ). If you are ingesting rules from untrusted third parties, consider running the parser in a worker with a timeout, or adding a regex complexity check (e.g. [safe-regex](https://github.com/nicolo-ribaudo/safe-regex2)) in your pipeline before passing rules to backends.

### Filesystem ingestion

`loadRulesFromDirectory` reads all matching files in a directory recursively with no cap on file count, individual file size, or total memory usage. On a well-managed rule repository this is fine. In contexts where the directory path or contents are user-controlled, a malicious actor could cause resource exhaustion by providing a directory containing many large files.

**Recommendation**: if the ingestion path is not fully trusted, enforce limits at the call site — for example, check `collection.rules.length` after loading, or pre-filter the directory listing before calling the loader.

## License

MIT
