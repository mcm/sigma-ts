/**
 * Sigma error hierarchy.
 * All errors extend SigmaError which extends Error.
 */

export class SigmaError extends Error {
  public readonly source?: string
  public override readonly cause?: unknown

  constructor(message: string, options?: { source?: string; cause?: unknown }) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined)
    this.name = 'SigmaError'
    if (options?.source !== undefined) {
      this.source = options.source
    }
    if (options?.cause !== undefined) {
      this.cause = options.cause
    }
    // Fix prototype chain for custom errors in TypeScript
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class SigmaRuleParseError extends SigmaError {
  constructor(message: string, options?: { source?: string; cause?: unknown }) {
    super(message, options)
    this.name = 'SigmaRuleParseError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class SigmaDetectionParseError extends SigmaError {
  constructor(message: string, options?: { source?: string; cause?: unknown }) {
    super(message, options)
    this.name = 'SigmaDetectionParseError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class SigmaConditionError extends SigmaError {
  public readonly token?: string

  constructor(message: string, options?: { source?: string; cause?: unknown; token?: string }) {
    super(message, options)
    this.name = 'SigmaConditionError'
    if (options?.token !== undefined) {
      this.token = options.token
    }
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class SigmaModifierError extends SigmaError {
  constructor(message: string, options?: { source?: string; cause?: unknown }) {
    super(message, options)
    this.name = 'SigmaModifierError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class SigmaTypeError extends SigmaError {
  constructor(message: string, options?: { source?: string; cause?: unknown }) {
    super(message, options)
    this.name = 'SigmaTypeError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class SigmaTransformationError extends SigmaError {
  constructor(message: string, options?: { source?: string; cause?: unknown }) {
    super(message, options)
    this.name = 'SigmaTransformationError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class SigmaPipelineParseError extends SigmaError {
  constructor(message: string, options?: { source?: string; cause?: unknown }) {
    super(message, options)
    this.name = 'SigmaPipelineParseError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class SigmaValidationError extends SigmaError {
  constructor(message: string, options?: { source?: string; cause?: unknown }) {
    super(message, options)
    this.name = 'SigmaValidationError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class SigmaPluginError extends SigmaError {
  constructor(message: string, options?: { source?: string; cause?: unknown }) {
    super(message, options)
    this.name = 'SigmaPluginError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
