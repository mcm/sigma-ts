import { describe, it, expect } from 'vitest'
import {
  SigmaError,
  SigmaRuleParseError,
  SigmaDetectionParseError,
  SigmaConditionError,
  SigmaModifierError,
  SigmaTypeError,
  SigmaTransformationError,
  SigmaPipelineParseError,
  SigmaValidationError,
  SigmaPluginError,
} from '../../src/exceptions.ts'

const allErrorClasses = [
  SigmaRuleParseError,
  SigmaDetectionParseError,
  SigmaConditionError,
  SigmaModifierError,
  SigmaTypeError,
  SigmaTransformationError,
  SigmaPipelineParseError,
  SigmaValidationError,
  SigmaPluginError,
]

describe('SigmaError base class', () => {
  it('is an instance of Error', () => {
    const err = new SigmaError('test')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(SigmaError)
  })

  it('has the correct name', () => {
    const err = new SigmaError('test')
    expect(err.name).toBe('SigmaError')
  })

  it('preserves the message', () => {
    const err = new SigmaError('hello world')
    expect(err.message).toBe('hello world')
  })

  it('accepts and exposes source', () => {
    const err = new SigmaError('test', { source: 'rule-123' })
    expect(err.source).toBe('rule-123')
  })

  it('accepts and exposes cause', () => {
    const cause = new Error('original')
    const err = new SigmaError('wrapped', { cause })
    expect(err.cause).toBe(cause)
  })

  it('has undefined source when not provided', () => {
    const err = new SigmaError('test')
    expect(err.source).toBeUndefined()
  })
})

describe('Derived error classes', () => {
  for (const ErrorClass of allErrorClasses) {
    describe(ErrorClass.name, () => {
      it('is instanceof SigmaError', () => {
        const err = new ErrorClass('test message')
        expect(err).toBeInstanceOf(SigmaError)
      })

      it('is instanceof Error', () => {
        const err = new ErrorClass('test message')
        expect(err).toBeInstanceOf(Error)
      })

      it('is instanceof itself', () => {
        const err = new ErrorClass('test message')
        expect(err).toBeInstanceOf(ErrorClass)
      })

      it('has name equal to class name', () => {
        const err = new ErrorClass('test message')
        expect(err.name).toBe(ErrorClass.name)
      })

      it('preserves message', () => {
        const err = new ErrorClass('specific error message')
        expect(err.message).toBe('specific error message')
      })

      it('accepts source option', () => {
        const err = new ErrorClass('test', { source: 'rule-abc' })
        expect(err.source).toBe('rule-abc')
      })

      it('accepts and chains cause', () => {
        const cause = new TypeError('root cause')
        const err = new ErrorClass('wrapped', { cause })
        expect(err.cause).toBe(cause)
      })
    })
  }
})

describe('SigmaConditionError', () => {
  it('exposes token field', () => {
    const err = new SigmaConditionError('bad token', { token: 'near' })
    expect(err.token).toBe('near')
  })

  it('token is undefined when not provided', () => {
    const err = new SigmaConditionError('error')
    expect(err.token).toBeUndefined()
  })
})

describe('Cross-subclass non-instanceof', () => {
  it('SigmaRuleParseError is not instanceof SigmaConditionError', () => {
    const err = new SigmaRuleParseError('test')
    expect(err).not.toBeInstanceOf(SigmaConditionError)
  })
})
