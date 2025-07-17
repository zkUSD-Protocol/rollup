import {
  createSerializableIndexedMap,
  SerializableMapData,
} from '../../core/map/serializable-indexed-map.js';
import { MapPruner, PruningRequest } from '../../core/map/map-pruner.js';
import { PrunedMapBase } from '../../core/map/pruned-map-base.js'
import { getRoot, MerkleRoot } from '../../core/map/merkle-root.js';
import { CollateralIOAccumulators } from './collateral-io-accumulators.js';
import { VaultAddress } from '../vault/vault-address.js';
import { DepositIntentUpdate, RedeemCollateralUpdate } from '../vault/vault-update.js';
import { Field, Struct, UInt64 } from 'o1js';

const IO_MAP_HEIGHT = 52; // 4,503,599,627,370,496 - 4.5 quadrillion

// Create base serializable map
const CollateralIoMapBase = createSerializableIndexedMap(IO_MAP_HEIGHT);

export class VerifiedAccumulatorsUpdate extends Struct({
  vaultAddress: VaultAddress,
  newIoAccumulatorsState: CollateralIOAccumulators,
}) {}


export class CollateralIoMap extends CollateralIoMapBase {
  /**
   * Create a pruned version of this map
   */
  createPruned(request: PruningRequest): PrunedCollateralIoMap {
    const prunedData = MapPruner.createPrunedData(this, request);
    return new PrunedCollateralIoMap(prunedData);
  }


  static getAccumulators(map: CollateralIoMap, address: VaultAddress): CollateralIOAccumulators {
    return CollateralIOAccumulators.unpack(map.get(address.key));
  }

  static createAccumulatorsForAddress(map: CollateralIoMap, address: VaultAddress): MerkleRoot<CollateralIoMap> {
    const io = new CollateralIOAccumulators({
      totalDeposits: UInt64.from(0),
      totalWithdrawals: UInt64.from(0),
    });
    map.insert(address.key, io.pack());
    return getRoot(map);
  }

  static verifiedUpdate(map: CollateralIoMap, update: VerifiedAccumulatorsUpdate): MerkleRoot<CollateralIoMap> {
    map.update(update.vaultAddress.key, update.newIoAccumulatorsState.pack());
    return getRoot(map);
  }

  static verifyWithdraw(map: CollateralIoMap, update: RedeemCollateralUpdate): VerifiedAccumulatorsUpdate {
    const oldAccumulators = CollateralIoMap.getAccumulators(map, update.vaultAddress);

    return new VerifiedAccumulatorsUpdate({
      vaultAddress: update.vaultAddress,
      newIoAccumulatorsState: new CollateralIOAccumulators({
        totalDeposits: oldAccumulators.totalDeposits,
        totalWithdrawals: oldAccumulators.totalWithdrawals.add(update.collateralDelta),
      }),
    });
  }

  static verifyDeposit(map: CollateralIoMap, update: DepositIntentUpdate): VerifiedAccumulatorsUpdate{
    const oldAccumulators = CollateralIoMap.getAccumulators(map, update.vaultAddress);

		// deposits must be bigger
		oldAccumulators.totalDeposits.assertLessThan(update.newIoMapTotalDeposits);
		const delta = update.newIoMapTotalDeposits.sub(oldAccumulators.totalDeposits);
		// deposit amount must be less or equal to the delta
		update.collateralDelta.assertLessThanOrEqual(delta);

    return new VerifiedAccumulatorsUpdate({
      vaultAddress: update.vaultAddress,
      newIoAccumulatorsState: new CollateralIOAccumulators({
        totalDeposits: update.newIoMapTotalDeposits,
        totalWithdrawals: oldAccumulators.totalWithdrawals,
      }),
    });
  }

  /**
   * Estimate pruning efficiency
   */
  estimatePruningEfficiency(request: PruningRequest) {
    return MapPruner.estimatePruningEfficiency(this, request);
  }

  /**
   * Create a ZkUsdMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): CollateralIoMap {
    return super.fromSerialized(data) as CollateralIoMap;
  }
}

export class PrunedCollateralIoMap extends PrunedMapBase {
  constructor(data: SerializableMapData) {
    super(new CollateralIoMapBase(), data);
  }

  /**
   * Create a PrunedZkUsdMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): PrunedCollateralIoMap {
    if (!CollateralIoMapBase.verifyIntegrity(data)) {
      throw new Error('Invalid serialized data for PrunedCollateralIoMap');
    }
    return new PrunedCollateralIoMap(data);
  }
}
