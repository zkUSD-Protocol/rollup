import {
  Struct,
  UInt64,
  Field,
  Bool,
  PublicKey,
} from 'o1js';

export class VaultState extends Struct({
  collateralAmount: UInt64,
  normalizedDebtAmount: UInt64,
  owner: PublicKey,
}) {}
