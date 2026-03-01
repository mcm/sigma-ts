import { readdir, readFile, realpath } from 'node:fs/promises'
import { join, extname, basename } from 'node:path'
import { SigmaCollection } from '../collection.js'
import { SigmaRule } from '../rule.js'
import { SigmaError, SigmaRuleParseError } from '../exceptions.js'
import type { CollectionError } from '../collection.js'

/** Options for {@link loadRulesFromDirectory}. */
export interface LoadOptions {
  /** Traverse subdirectories. Default: `true`. */
  recursive?: boolean
  /** File extensions to include (case-insensitive). Default: `['.yml', '.yaml']`. */
  extensions?: string[]
  /**
   * How to handle parse errors.
   * - `'collect'` (default): accumulate errors in `collection.errors` and continue.
   * - `'throw'`: throw the first `SigmaError` encountered.
   */
  errorHandling?: 'collect' | 'throw'
}

async function collectFiles(
  dir: string,
  extensions: string[],
  recursive: boolean,
  visited: Set<string> = new Set(),
): Promise<string[]> {
  // Resolve symlinks to detect cycles before descending
  let realDir: string
  try {
    realDir = await realpath(dir)
  } catch {
    return []
  }
  if (visited.has(realDir)) return []
  visited.add(realDir)

  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory() && recursive) {
      const sub = await collectFiles(fullPath, extensions, recursive, visited)
      files.push(...sub)
    } else if (entry.isFile() && extensions.includes(extname(entry.name).toLowerCase())) {
      files.push(fullPath)
    }
  }
  return files
}

/**
 * Recursively load Sigma rules from a directory on the local filesystem.
 *
 * Files are discovered in sorted order. Each successfully parsed rule has its
 * source path stored at `rule.customAttributes.get('filename')`.
 *
 * @param dir - Absolute or relative path to the directory to scan.
 * @param options - Optional settings (recursive, extensions, errorHandling).
 * @returns A `SigmaCollection` containing all parsed rules and any parse errors.
 */
export async function loadRulesFromDirectory(
  dir: string,
  options: LoadOptions = {},
): Promise<SigmaCollection> {
  const recursive = options.recursive ?? true
  const extensions = options.extensions ?? ['.yml', '.yaml']
  const errorHandling = options.errorHandling ?? 'collect'

  const files = (await collectFiles(dir, extensions, recursive)).sort()

  const rules: SigmaRule[] = []
  const errors: CollectionError[] = []

  for (const file of files) {
    let content: string
    try {
      content = await readFile(file, 'utf-8')
    } catch (e) {
      const err = new SigmaRuleParseError(`Failed to read file: ${basename(file)}`, { cause: e })
      errors.push({ source: file, error: err })
      continue
    }

    try {
      const rule = SigmaRule.fromYAML(content)
      // Attach source filename to customAttributes
      const attrs = new Map<string, unknown>(rule.customAttributes)
      attrs.set('filename', file)
      rules.push(rule._clone({ customAttributes: attrs }))
    } catch (e) {
      if (e instanceof SigmaError) {
        errors.push({ source: file, error: e })
      } else {
        errors.push({
          source: file,
          error: new SigmaRuleParseError(`Failed to parse rule: ${basename(file)}`, { cause: e }),
        })
      }
    }
  }

  if (errorHandling === 'throw' && errors.length > 0) {
    throw errors[0]?.error ?? new SigmaRuleParseError('Unknown parse error')
  }

  return new SigmaCollection(rules, errors)
}
