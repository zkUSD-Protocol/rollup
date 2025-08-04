import { createSerializableIndexedMap } from "../../core/map/serializable-indexed-map.js";
import { MapPruner, PruningRequest } from "../../core/map/map-pruner.js";
import { PrunedMapBase } from "../../core/map/pruned-map-base.js";
import { SerializableMapData } from "../../core/map/serializable-indexed-map.js";
import { getRoot, MerkleRoot } from "../../core/map/merkle-root.js";
import { ZkUsdVaults } from "./zkusd-vaults.js";
import { CreateVaultIntentUpdate, DebtRepaymentUpdate, DepositIntentUpdate, MintIntentUpdate, RedeemCollateralUpdate } from "./vault-update.js";
import { Vault, VaultParameters, VaultTypeData } from "./vault.js";
import { Bool, Field, Provable, Struct, UInt64, UInt8 } from "o1js";
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


  static verifiedInsert(map: VaultMap, verifiedUpdate: VerifiedMapInsert): MerkleRoot<VaultMap> {
    map.insert(verifiedUpdate.vaultAddress.key, verifiedUpdate.newPackedState);
    return getRoot(map);
  }

  static verifiedUpdate(map: VaultMap, verifiedUpdate: VerifiedMapUpdate): MerkleRoot<VaultMap> {
    map.update(verifiedUpdate.vaultAddress.key, verifiedUpdate.newPackedState);
    return getRoot(map);
  }

  /**
   * Retrieves a vault from the map after verifying the map root and getting the correct parameters
   * @param state The current vault state
   * @param vaultAddress The address of the vault to retrieve
   * @param collateralType The collateral type of the vault
   * @returns The unpacked Vault instance
   */
  private static getVault(
    map: VaultMap,
    state: ZkUsdVaults,
    vaultAddress: VaultAddress,
    collateralType: CollateralType
  ) {
    // pick the parameters
    const vaultParameters: VaultParameters = Provable.if(
      collateralType.equals(CollateralType.SUI),
      state.suiVaultTypeState.parameters,
      state.minaVaultTypeState.parameters
    );

    // recreate the vault from the state
    return Vault(vaultParameters).unpack(map.get(vaultAddress.key));
  }

  private static getVaultFromVaultTypeData(
    map: VaultMap,
    vaultTypeData: VaultTypeData,
    vaultAddress: VaultAddress
  ) {
    return vaultTypeData.Vault().unpack(map.get(vaultAddress.key));
  }

  /**
   * Retrieves a vault from the map after verifying the map root and getting the correct parameters
   * @param state The current vault state
   * @param collateralType The collateral type of the vault
   * @returns The unpacked Vault instance
   */
  public static getVaultTypeData(
    state: ZkUsdVaults,
    collateralType: CollateralType
  ) {
    // pick the parameters
    const vaultTypeData: VaultTypeData = Provable.if(
      collateralType.equals(CollateralType.SUI),
      state.suiVaultTypeState,
      state.minaVaultTypeState
    );

    return vaultTypeData;
  }

static verifyCreateVaultUpdate(map: VaultMap, state: ZkUsdVaults, update: CreateVaultIntentUpdate): VerifiedMapUpdate {
  const { vaultAddress, collateralType } = update;
  // map is up-to-date wrt to the state
  getRoot(map).assertEquals(state.vaultMapRoot);

  // assert vaultAddress does not exist
  map.assertNotIncluded(vaultAddress.key);

  // recreate the vault from the state
  const vaultTypeData = VaultMap.getVaultTypeData(state, collateralType);
  const vault = VaultMap.getVaultFromVaultTypeData(map, vaultTypeData, vaultAddress);

  return new VerifiedMapInsert({
    vaultAddress: vaultAddress,
    newPackedState: Vault(vaultTypeData.parameters).pack(vault),
  });
}

static verifyRedeemCollateralUpdate(map: VaultMap, state: ZkUsdVaults,  update: RedeemCollateralUpdate): VerifiedMapUpdate {
  const { vaultAddress, collateralDelta, collateralType } = update;

  // map is up-to-date wrt to the state
  getRoot(map).assertEquals(state.vaultMapRoot);

  // assert vaultAddress exists
  map.assertIncluded(vaultAddress.key);

  // recreate the vault from the state
  const vaultTypeData = VaultMap.getVaultTypeData(state, collateralType);
  const vault = VaultMap.getVaultFromVaultTypeData(map, vaultTypeData, vaultAddress);

  vault.redeemCollateral(collateralDelta, state.minaVaultTypeState.priceNanoUsd.current);
  
  return new VerifiedMapUpdate({
    vaultAddress: vaultAddress,
    newPackedState: Vault(vaultTypeData.parameters).pack(vault),
  });
}

static verifyDepositCollateralUpdate(map: VaultMap, state: ZkUsdVaults,  update: DepositIntentUpdate): VerifiedMapUpdate {
  const { vaultAddress, collateralDelta, collateralType } = update;

  // map is up-to-date wrt to the state
  getRoot(map).assertEquals(state.vaultMapRoot);

  // assert vaultAddress exists
  map.assertIncluded(vaultAddress.key);

  // recreate the vault from the state
  const vaultTypeData = VaultMap.getVaultTypeData(state, collateralType);
  const vault = VaultMap.getVaultFromVaultTypeData(map, vaultTypeData, vaultAddress);

  vault.depositCollateral(collateralDelta);
  
  return new VerifiedMapUpdate({
    vaultAddress: vaultAddress,
    newPackedState: Vault(vaultTypeData.parameters).pack(vault),
  });
}

static verifyLiquidationUpdate(map: VaultMap, state: ZkUsdVaults,  update: DebtRepaymentUpdate): { verifiedUpdate: VerifiedMapUpdate, liquidateeCollateralDelta: UInt64, liquidatorCollateralDelta: UInt64 } {
  const { vaultAddress, debtDelta, collateralType } = update;

  // map is up-to-date wrt to the state
  getRoot(map).assertEquals(state.vaultMapRoot);

  // assert vaultAddress exists
  map.assertIncluded(vaultAddress.key);

  // recreate the vault from the state
  const vaultTypeData = VaultMap.getVaultTypeData(state, collateralType);
  const vault = VaultMap.getVaultFromVaultTypeData(map, vaultTypeData, vaultAddress);

  const { liquidateeCollateralDelta, liquidatorCollateralDelta } = vault.liquidate(debtDelta);

  vault.repayDebt(debtDelta, vaultTypeData.globalAccumulativeInterestRateScaled);
  
  return {
    verifiedUpdate: new VerifiedMapUpdate({
      vaultAddress: vaultAddress,
      newPackedState: Vault(vaultTypeData.parameters).pack(Vault(vaultTypeData.parameters).empty()),
    }),
    liquidateeCollateralDelta: liquidateeCollateralDelta,
    liquidatorCollateralDelta: liquidatorCollateralDelta,
  };
}

static verifyRepayDebtUpdate(map: VaultMap, state: ZkUsdVaults,  update: DebtRepaymentUpdate): VerifiedMapUpdate {
  const { vaultAddress, debtDelta, collateralType } = update;

  // map is up-to-date wrt to the state
  getRoot(map).assertEquals(state.vaultMapRoot);

  // assert vaultAddress exists
  map.assertIncluded(vaultAddress.key);

  // recreate the vault from the state
  const vaultTypeData = VaultMap.getVaultTypeData(state, collateralType);
  const vault = VaultMap.getVaultFromVaultTypeData(map, vaultTypeData, vaultAddress);

  vault.repayDebt(debtDelta, vaultTypeData.globalAccumulativeInterestRateScaled);
  
  return new VerifiedMapUpdate({
    vaultAddress: vaultAddress,
    newPackedState: Vault(vaultTypeData.parameters).pack(vault),
  });
}

static getUpdateVault(map: VaultMap, state: ZkUsdVaults, address: VaultAddress, collateralType: CollateralType) {
  
  // recreate the vault from the state
  const vaultTypeData = VaultMap.getVaultTypeData(state, collateralType);
  const vault = VaultMap.getVaultFromVaultTypeData(map, vaultTypeData, address);

  return vault;
}

static verifyMintUpdate(map: VaultMap, state: ZkUsdVaults,  update: MintIntentUpdate, collateralPriceNanoUsd: UInt64): VerifiedMapUpdate {
  const { vaultAddress, debtDelta, collateralType } = update;

  // map is up-to-date wrt to the state
  getRoot(map).assertEquals(state.vaultMapRoot);

  // assert vaultAddress exists
  map.assertIncluded(vaultAddress.key);

  // recreate the vault from the state
  const vaultTypeData = VaultMap.getVaultTypeData(state, collateralType);
  const vault = VaultMap.getVaultFromVaultTypeData(map, vaultTypeData, vaultAddress);

  vault.mintZkUsd(debtDelta, collateralPriceNanoUsd, vaultTypeData.globalAccumulativeInterestRateScaled);
  
  return new VerifiedMapUpdate({
    vaultAddress: vaultAddress,
    newPackedState: Vault(vaultTypeData.parameters).pack(vault),
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