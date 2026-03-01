import * as ipaddr from 'ipaddr.js'
import { SigmaTypeError } from '../exceptions.js'
import { SigmaString } from './sigma-string.js'
import type { SigmaStringPart } from './sigma-string.js'

// ipaddr.js is a CJS module; when bundled to ESM the namespace import may wrap
// exports under .default. Resolve at runtime to support both environments.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ipaddrLib: typeof ipaddr = (ipaddr as any).parseCIDR ? ipaddr : (ipaddr as any).default

export class SigmaCIDRExpression {
  readonly cidr: string
  private readonly _addr: ipaddr.IPv4 | ipaddr.IPv6
  private readonly _prefix: number

  constructor(cidr: string) {
    this.cidr = cidr
    try {
      const parsed = ipaddrLib.parseCIDR(cidr)
      this._addr = parsed[0]
      this._prefix = parsed[1]
    } catch (e) {
      throw new SigmaTypeError(`Invalid CIDR notation: ${cidr}`, { cause: e })
    }
  }

  network(): { address: string; prefixLength: number } {
    return {
      address: this._addr.toString(),
      prefixLength: this._prefix,
    }
  }

  /**
   * Expand CIDR to wildcard-prefix strings for pattern matching.
   * IPv4: /8 → "10.*", /16 → "10.20.*", /24 → "10.20.30.*"
   * For other prefix lengths, return the network address as-is.
   */
  expand(): SigmaString[] {
    if (this._addr.kind() === 'ipv4') {
      return this._expandIPv4()
    }
    return this._expandIPv6()
  }

  private _expandIPv4(): SigmaString[] {
    const addr = this._addr as ipaddr.IPv4
    const octets = addr.octets
    const prefix = this._prefix

    // For standard octet boundaries, produce wildcard strings
    if (prefix === 8) {
      const parts: SigmaStringPart[] = [
        { kind: 'plain', value: `${octets[0]}.` },
        { kind: 'wildcard', wildcard: '*' },
      ]
      return [SigmaString.fromParts(parts)]
    } else if (prefix === 16) {
      const parts: SigmaStringPart[] = [
        { kind: 'plain', value: `${octets[0]}.${octets[1]}.` },
        { kind: 'wildcard', wildcard: '*' },
      ]
      return [SigmaString.fromParts(parts)]
    } else if (prefix === 24) {
      const parts: SigmaStringPart[] = [
        { kind: 'plain', value: `${octets[0]}.${octets[1]}.${octets[2]}.` },
        { kind: 'wildcard', wildcard: '*' },
      ]
      return [SigmaString.fromParts(parts)]
    } else if (prefix === 32) {
      return [SigmaString.plain(`${octets[0]}.${octets[1]}.${octets[2]}.${octets[3]}`)]
    } else {
      // For non-standard prefixes, return a string with the network representation
      return [SigmaString.plain(this._addr.toString())]
    }
  }

  private _expandIPv6(): SigmaString[] {
    // For IPv6, return the address in its normalized form
    return [SigmaString.plain(this._addr.toString())]
  }

  toString(): string {
    return this.cidr
  }

  equals(other: SigmaCIDRExpression): boolean {
    return this.cidr === other.cidr
  }
}
