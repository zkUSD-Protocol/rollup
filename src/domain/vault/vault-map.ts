import { createSerializableIndexedMap } from "../../core/map/serializable-indexed-map.js";
import { MapPruner, PruningRequest } from "../../core/map/map-pruner.js";
import { PrunedMapBase } from "../../core/map/pruned-map-base.js";
import { SerializableMapData } from "../../core/map/serializable-indexed-map.js";
import { MerkleRoot } from "../../core/map/merkle-root.js";
import { ZkUsdVaults } from "./zkusd-vaults.js";
import { CreateVaultIntentUpdate, DebtRepaymentUpdate, DepositIntentUpdate, RedeemIntentUpdate } from "./vault-update.js";
import { Vault, VaultParameters } from "./vault.js";
import { Provable } from "o1js";
import { CollateralType } from "./vault-collateral-type.js";

export const VAULT_MAP_HEIGHT = 20; // 1,048,576

// Create base serializable map
const VaultMapBase = createSerializableIndexedMap(VAULT_MAP_HEIGHT);

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

verifyAndInsert(state: ZkUsdVaults, update: CreateVaultIntentUpdate): MerkleRoot<VaultMap> {
  const { vaultAddress, collateralType } = update;
  
  // map is up-to-date wrt to the state
  this.getRoot().assertEquals(state.vaultMapRoot);

  // pick the parameters
  const vaultParameters: VaultParameters = Provable.if(collateralType.equals(CollateralType.SUI),
    state.suiVaultTypeState.parameters,
    state.minaVaultTypeState.parameters
  );

  // recreate the vault from the state
  const vault = Vault(vaultParameters).new(collateralType);
  
  // Add the vault to the map
  this.insert(vaultAddress.key, vault.pack());

  return this.getRoot();
}

verifyAndRedeemCollateralUpdate(state: ZkUsdVaults,  update: RedeemIntentUpdate): MerkleRoot<VaultMap> {
  const { vaultAddress, collateralDelta, collateralType } = update;

  // map is up-to-date wrt to the state
  this.getRoot().assertEquals(state.vaultMapRoot);

  // pick the parameters
  const vaultParameters: VaultParameters = Provable.if(collateralType.equals(CollateralType.SUI),
    state.suiVaultTypeState.parameters,
    state.minaVaultTypeState.parameters
  );

  // recreate the vault from the state
  const vault = Vault(vaultParameters).unpack(this.get(vaultAddress.key));
  vault.redeemCollateral(collateralDelta, state.minaVaultTypeState.priceNanoUsd);
  
  // Update the vault (it proves that the key exists)
  this.update(vaultAddress.key, vault.pack());

  return this.getRoot();
}

verifyAndDepositCollateralUpdate(state: ZkUsdVaults,  update: DepositIntentUpdate): MerkleRoot<VaultMap> {
  const { vaultAddress, collateralDelta, collateralType } = update;

  // map is up-to-date wrt to the state
  this.getRoot().assertEquals(state.vaultMapRoot);

  // pick the parameters
  const vaultParameters: VaultParameters = Provable.if(collateralType.equals(CollateralType.SUI),
    state.suiVaultTypeState.parameters,
    state.minaVaultTypeState.parameters
  );

  // recreate the vault from the state
  const vault = Vault(vaultParameters).unpack(this.get(vaultAddress.key));
  vault.depositCollateral(collateralDelta);
  
  // Update the vault (it proves that the key exists)
  this.update(vaultAddress.key, vault.pack());

  return this.getRoot();
}

verifyAndRepayDebtUpdate(state: ZkUsdVaults,  update: DebtRepaymentUpdate): MerkleRoot<VaultMap> {
  const { vaultAddress, debtDelta, collateralType } = update;

  // map is up-to-date wrt to the state
  this.getRoot().assertEquals(state.vaultMapRoot);

  // pick the parameters
  const vaultParameters: VaultParameters = Provable.if(collateralType.equals(CollateralType.SUI),
    state.suiVaultTypeState.parameters,
    state.minaVaultTypeState.parameters
  );

  // recreate the vault from the state
  const vault = Vault(vaultParameters).unpack(this.get(vaultAddress.key));
  vault.repayDebt(debtDelta);
  
  // Update the vault (it proves that the key exists)
  this.update(vaultAddress.key, vault.pack());

  return this.getRoot();
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