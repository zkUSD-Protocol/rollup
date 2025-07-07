import { Bool, Struct, UInt64, UInt8 } from "o1js";
import { VaultAddress } from "./vault-address.js";
import { CollateralType } from "./vault-collateral-type.js";
import { VaultState } from "./vault-state.js";


export class VaultUpdateType extends Struct({ value: UInt8 }) {

  static readonly NEW = new VaultUpdateType({value: UInt8.from(0)});
  static readonly UPDATE = new VaultUpdateType({value: UInt8.from(1)});

  equals(other: VaultUpdateType): Bool {
    return this.value.value.equals(other.value.value);
  }
}

export class VaultUpdate extends Struct({
  vaultAddress: VaultAddress,
  vaultState: VaultState,
  updateType: VaultUpdateType,
}) {
  static updateVault(vaultAddress: VaultAddress, vaultState: VaultState): VaultUpdate {
    return new VaultUpdate({
      vaultAddress: vaultAddress,
      vaultState: vaultState,
      updateType: VaultUpdateType.UPDATE,
    });
  }

  static newVault(collateralType: CollateralType, vaultAddress: VaultAddress): VaultUpdate {
    return new VaultUpdate({
      vaultAddress: vaultAddress,
      vaultState: VaultState.zero(collateralType),
      updateType: VaultUpdateType.NEW,
    });
  }
}

export class DebtRepaymentIntentUpdate extends Struct({
  vaultAddress: VaultAddress,
  debtDelta: UInt64,
  collateralType: CollateralType,
}) {}

export class MintIntentUpdate extends Struct({
  vaultAddress: VaultAddress,
  debtDelta: UInt64,
  collateralType: CollateralType,
}) {}
    
export class DepositIntentUpdate extends Struct({
  vaultAddress: VaultAddress,
  collateralDelta: UInt64,
  newIoMapTotalDeposits: UInt64,
  collateralType: CollateralType,
}) {}

export class CreateVaultIntentUpdate extends Struct({
  vaultAddress: VaultAddress,
  collateralType: CollateralType,
}) {}

export class RedeemIntentUpdate extends Struct({
  vaultAddress: VaultAddress,
  collateralDelta: UInt64,
  collateralType: CollateralType,
}) {}