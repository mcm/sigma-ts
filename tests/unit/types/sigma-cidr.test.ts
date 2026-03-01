import { describe, it, expect } from 'vitest'
import { SigmaCIDRExpression } from '../../../src/types/sigma-cidr.ts'
import { SigmaTypeError } from '../../../src/exceptions.ts'

describe('SigmaCIDRExpression', () => {
  it('parses IPv4 /24 CIDR', () => {
    const cidr = new SigmaCIDRExpression('192.168.1.0/24')
    expect(cidr.cidr).toBe('192.168.1.0/24')
  })

  it('network() returns address and prefix', () => {
    const cidr = new SigmaCIDRExpression('10.0.0.0/8')
    const net = cidr.network()
    expect(net.prefixLength).toBe(8)
  })

  it('expand() for /24 produces wildcard string', () => {
    const cidr = new SigmaCIDRExpression('192.168.1.0/24')
    const expanded = cidr.expand()
    expect(expanded.length).toBeGreaterThan(0)
    const str = expanded[0]!
    expect(str.contains_wildcard()).toBe(true)
    expect(str.startswith('192.168.1.')).toBe(true)
  })

  it('expand() for /16 produces wildcard string', () => {
    const cidr = new SigmaCIDRExpression('192.168.0.0/16')
    const expanded = cidr.expand()
    expect(expanded[0]!.startswith('192.168.')).toBe(true)
  })

  it('expand() for /8 produces wildcard string', () => {
    const cidr = new SigmaCIDRExpression('10.0.0.0/8')
    const expanded = cidr.expand()
    expect(expanded[0]!.startswith('10.')).toBe(true)
  })

  it('throws SigmaTypeError for invalid CIDR', () => {
    expect(() => new SigmaCIDRExpression('not-a-cidr')).toThrow(SigmaTypeError)
  })

  it('parses IPv6 CIDR', () => {
    const cidr = new SigmaCIDRExpression('2001:db8::/32')
    expect(cidr.cidr).toBe('2001:db8::/32')
    const net = cidr.network()
    expect(net.prefixLength).toBe(32)
  })

  it('equals works', () => {
    expect(new SigmaCIDRExpression('10.0.0.0/8').equals(new SigmaCIDRExpression('10.0.0.0/8'))).toBe(true)
    expect(new SigmaCIDRExpression('10.0.0.0/8').equals(new SigmaCIDRExpression('10.0.0.0/16'))).toBe(false)
  })

  it('expand() for /32 returns exact IP address (no wildcard)', () => {
    const cidr = new SigmaCIDRExpression('192.168.1.1/32')
    const expanded = cidr.expand()
    expect(expanded).toHaveLength(1)
    expect(expanded[0]!.contains_wildcard()).toBe(false)
    expect(expanded[0]!.plain_value()).toBe('192.168.1.1')
  })

  it('expand() for non-standard prefix returns network address string', () => {
    const cidr = new SigmaCIDRExpression('10.0.0.0/12')
    const expanded = cidr.expand()
    expect(expanded).toHaveLength(1)
  })

  it('expand() for IPv6 CIDR returns normalized address', () => {
    const cidr = new SigmaCIDRExpression('2001:db8::/32')
    const expanded = cidr.expand()
    expect(expanded).toHaveLength(1)
  })

  it('toString() returns the original CIDR string', () => {
    const cidr = new SigmaCIDRExpression('10.0.0.0/8')
    expect(cidr.toString()).toBe('10.0.0.0/8')
  })
})
