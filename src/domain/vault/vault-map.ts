import { createSerializableIndexedMap } from "../../core/map/serializable-indexed-map.js";
import { MapPruner, PruningRequest } from "../../core/map/map-pruner.js";
import { PrunedMapBase } from "../../core/map/pruned-map-base.js";
import { SerializableMapData } from "../../core/map/serializable-indexed-map.js";
import { MerkleRoot } from "../../core/map/merkle-root.js";
import { ZkUsdVaults } from "./zkusd-vaults.js";
import { CreateVaultIntentUpdate, DebtRepaymentIntentUpdate, DepositIntentUpdate, MintIntentUpdate, RedeemIntentUpdate } from "./vault-update.js";
import { Vault, VaultParameters } from "./vault.js";
import { Bool, Field, Provable, Struct, UInt8 } from "o1js";
import { CollateralType } from "./vault-collateral-type.js";
import { VaultAddress } from "./vault-address.js";

export const VAULT_MAP_HEIGHT = 20; // 1,048,576

// Create base serializable map
const VaultMapBase = createSerializableIndexedMap(VAULT_MAP_HEIGHT);

export class VerifiedMapInsert extends Struct({
  vaultAddress: VaultAddress,
  newPackedState: Field,
}) {} 


export class VerifiedMapUpdate extends Struct({
  vaultAddress: VaultAddress,
  newPackedState: Field,
}) {}


export class VaultMap extends VaultMapBase {
  /**
   * Create a pruned version of this map
   */
  createPruned(request: PruningRequest): PrunedVaultMap {
    const prunedData = MapPruner.createPrunedData(this, request);
    return new PrunedVaultMap(prunedData);
  }

  /**
   * Estimate pruning efficiency
   */
  estimatePruningEfficiency(request: PruningRequest) {
    return MapPruner.estimatePruningEfficiency(this, request);
  }

  /**
   * Create a VaultMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): VaultMap {
    return super.fromSerialized(data) as VaultMap;
  }

  getRoot(): MerkleRoot<VaultMap> {
    return new MerkleRoot({ root: this.root });
  }


  verifiedInsert(verifiedUpdate: VerifiedMapInsert): MerkleRoot<VaultMap> {
    this.insert(verifiedUpdate.vaultAddress.key, verifiedUpdate.newPackedState);
    return this.getRoot();
  }

  verifiedUpdate(verifiedUpdate: VerifiedMapUpdate): MerkleRoot<VaultMap> {
    this.update(verifiedUpdate.vaultAddress.key, verifiedUpdate.newPackedState);
    return this.getRoot();
  }

  /**
   * Retrieves a vault from the map after verifying the map root and getting the correct parameters
   * @param state The current vault state
   * @param vaultAddress The address of the vault to retrieve
   * @param collateralType The collateral type of the vault
   * @returns The unpacked Vault instance
   */
  private getVault(
    state: ZkUsdVaults,
    vaultAddress: VaultAddress,
    collateralType: CollateralType
  ) {
    // map is up-to-date wrt to the state
    this.getRoot().assertEquals(state.vaultMapRoot);

    // pick the parameters
    const vaultParameters: VaultParameters = Provable.if(
      collateralType.equals(CollateralType.SUI),
      state.suiVaultTypeState.parameters,
      state.minaVaultTypeState.parameters
    );

    // recreate the vault from the state
    return Vault(vaultParameters).unpack(this.get(vaultAddress.key));
  }

verifyCreateVaultUpdate(state: ZkUsdVaults, update: CreateVaultIntentUpdate): VerifiedMapUpdate {
  const { vaultAddress, collateralType } = update;
  
  // assert vaultAddress does not exist
  this.assertNotIncluded(vaultAddress.key);

  // recreate the vault from the state
  const vault = this.getVault(state, vaultAddress, collateralType);

  return new VerifiedMapInsert({
    vaultAddress: vaultAddress,
    newPackedState: vault.pack(),
  });
}

verifyRedeemCollateralUpdate(state: ZkUsdVaults,  update: RedeemIntentUpdate): VerifiedMapUpdate {
  const { vaultAddress, collateralDelta, collateralType } = update;

  // assert vaultAddress exists
  this.assertIncluded(vaultAddress.key);

  // recreate the vault from the state
  const vault = this.getVault(state, vaultAddress, collateralType);

  vault.redeemCollateral(collateralDelta, state.minaVaultTypeState.priceNanoUsd);
  
  return new VerifiedMapUpdate({
    vaultAddress: vaultAddress,
    newPackedState: vault.pack(),
  });
}

verifyDepositCollateralUpdate(state: ZkUsdVaults,  update: DepositIntentUpdate): VerifiedMapUpdate {
  const { vaultAddress, collateralDelta, collateralType } = update;

  // assert vaultAddress exists
  this.assertIncluded(vaultAddress.key);

  // recreate the vault from the state
  const vault = this.getVault(state, vaultAddress, collateralType);

  vault.depositCollateral(collateralDelta);
  
  return new VerifiedMapUpdate({
    vaultAddress: vaultAddress,
    newPackedState: vault.pack(),
  });
}

verifyRepayDebtUpdate(state: ZkUsdVaults,  update: DebtRepaymentIntentUpdate): VerifiedMapUpdate {
  const { vaultAddress, debtDelta, collateralType } = update;

  // assert vaultAddress exists
  this.assertIncluded(vaultAddress.key);

  // recreate the vault from the state
  const vault = this.getVault(state, vaultAddress, collateralType);

  vault.repayDebt(debtDelta);
  
  return new VerifiedMapUpdate({
    vaultAddress: vaultAddress,
    newPackedState: vault.pack(),
  });
}

verifyMintUpdate(state: ZkUsdVaults,  update: MintIntentUpdate): VerifiedMapUpdate {
  const { vaultAddress, debtDelta, collateralType } = update;

  // assert vaultAddress exists
  this.assertIncluded(vaultAddress.key);

  // recreate the vault from the state
  const vault = this.getVault(state, vaultAddress, collateralType);

  vault.mintZkUsd(debtDelta, state.minaVaultTypeState.priceNanoUsd);
  
  return new VerifiedMapUpdate({
    vaultAddress: vaultAddress,
    newPackedState: vault.pack(),
  });
}



}

export class PrunedVaultMap extends PrunedMapBase {
  constructor(data: SerializableMapData) {
    super(new VaultMapBase(), data);
  }

  /**
   * Create a PrunedVaultMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): PrunedVaultMap {
    if (!VaultMapBase.verifyIntegrity(data)) {
      throw new Error('Invalid serialized data for PrunedVaultMap');
    }
    return new PrunedVaultMap(data);
  }

  


}