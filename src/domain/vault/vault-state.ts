import {
  Struct,
  UInt64,
  Field,
  PublicKey,
} from 'o1js';
import { CollateralType } from './vault-collateral-type.js';

export class VaultState extends Struct({
  collateralType: CollateralType,
  collateralAmount: UInt64,
  normalizedDebtAmount: UInt64,
}) {
  static zero(collateralType: CollateralType): VaultState {
    return new VaultState({
      collateralType: collateralType,
      collateralAmount: UInt64.zero,
      normalizedDebtAmount: UInt64.zero,
    });
  }

  static pack(state: VaultState): Field {
    const bits = [
      ...state.collateralType.value.toBits(8),
      ...state.collateralAmount.value.toBits(64),
      ...state.normalizedDebtAmount.value.toBits(64),
    ];
    return Field.fromBits(bits);
  }

  static unpack(field: Field): VaultState {
    const bits = field.toBits();
    // first bits are collateral type
    const collateralType = CollateralType.fromBits(bits.slice(0, 8));
    const collateralAmount = UInt64.fromBits(bits.slice(8, 64));
    const normalizedDebtAmount = UInt64.fromBits(bits.slice(64, 128));
    return new VaultState({
      collateralType: collateralType,
      collateralAmount: collateralAmount,
      normalizedDebtAmount: normalizedDebtAmount,
    });
  }
}