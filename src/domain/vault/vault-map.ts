import { createSerializableIndexedMap } from "../../core/map/serializable-indexed-map";
import { MapPruner, PruningRequest } from "../../core/map/map-pruner";
import { PrunedMapBase } from "../../core/map/pruned-map-base";
import { SerializableMapData } from "../../core/map/serializable-indexed-map";
import { MerkleRoot } from "../../core/map/merkle-root";
import { ZkusdVaults } from "./zkusd-vaults";
import { VaultUpdate } from "./vault-update";
import { Vault, VaultParameters } from "./vault";
import { Provable } from "o1js";
import { CollateralType } from "./vault-collateral-type";

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

  getRoot(): MerkleRoot<VaultMap, any> {
    return new MerkleRoot({ root: this.root });
  }

verifyAndInsert(state: ZkusdVaults, update: VaultUpdate) {
  const { vaultAddress, vaultState } = update;

  // map is up-to-date wrt to the state
  this.getRoot().assertEquals(state.vaultMapRoot.liveRoot);

  // pick the parameters
  const vaultParameters: VaultParameters = Provable.if(update.collateralType.equals(CollateralType.SuiCollateralType()),
    state.suiVaultParameters,
    state.minaVaultParameters
  );

  // recreate the vault from the state
  const vault = Vault(vaultParameters).new(vaultState);
  
  // Add the vault to the map
  this.insert(vaultAddress.key, vault.pack());
}

verifyAndUpdate(state: ZkusdVaults, update: VaultUpdate) {
  const { vaultAddress, vaultState } = update;

  // map is up-to-date wrt to the state
  this.getRoot().assertEquals(state.vaultMapRoot.liveRoot);

  // pick the parameters
  const vaultParameters: VaultParameters = Provable.if(update.collateralType.equals(CollateralType.SuiCollateralType()),
    state.suiVaultParameters,
    state.minaVaultParameters
  );

  // recreate the vault from the state
  const vault = Vault(vaultParameters).new(vaultState);
  
  // Update the vault (it proves that the key exists)
  this.update(vaultAddress.key, vault.pack());
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