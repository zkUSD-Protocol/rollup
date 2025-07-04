import { Bool, Struct, UInt8 } from "o1js";

export class CollateralType extends Struct({ value: UInt8 }) {

  /** Enumeration-like pre-defined options */
  static readonly MINA = new CollateralType({value: UInt8.from(0)});
  static readonly SUI  = new CollateralType({value: UInt8.from(1)});

  equals(other: CollateralType): Bool {
    return this.value.value.equals(other.value.value);
  }

  static fromBits(bits: Bool[]): CollateralType {
    return new CollateralType({value: UInt8.fromBits(bits)});
  }
}