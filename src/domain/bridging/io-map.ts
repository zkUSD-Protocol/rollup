import {
  createSerializableIndexedMap,
  SerializableMapData,
} from '../../core/map/serializable-indexed-map.js';
import { MapPruner, PruningRequest } from '../../core/map/map-pruner.js';
import { PrunedMapBase } from '../../core/map/pruned-map-base.js'
import { MerkleRoot } from '../../core/map/merkle-root.js';
import { IOAccumulators } from './io-accumulators.js';
import { VaultAddress } from '../vault/vault-address.js';
import { DepositIntentUpdate, RedeemIntentUpdate } from '../vault/vault-update.js';

const IO_MAP_HEIGHT = 52; // 4,503,599,627,370,496 - 4.5 quadrillion

// Create base serializable map
const IoMapBase = createSerializableIndexedMap(IO_MAP_HEIGHT);

export class IoMap extends IoMapBase {
  /**
   * Create a pruned version of this map
   */
  createPruned(request: PruningRequest): PrunedIoMap {
    const prunedData = MapPruner.createPrunedData(this, request);
    return new PrunedIoMap(prunedData);
  }

  /**
   * Get the root of the map
   */
  getRoot(): MerkleRoot<IoMap> {
    return new MerkleRoot({ root: this.root });
  }

  getAccumulators(address: VaultAddress): IOAccumulators {
    return IOAccumulators.unpack(this.get(address.key));
  }
  verifyAndWithdraw(address: VaultAddress, update: RedeemIntentUpdate): MerkleRoot<IoMap> {
    const oldAccumulators = this.getAccumulators(address);

    // update the map
    this.update(address.key, new IOAccumulators({
      totalDeposits: oldAccumulators.totalDeposits,
      totalWithdrawals: oldAccumulators.totalWithdrawals.add(update.collateralDelta),
    }).pack());
    
    return this.getRoot();
  }

  verifyAndDeposit(address: VaultAddress, update: DepositIntentUpdate): MerkleRoot<IoMap> {
    const oldAccumulators = this.getAccumulators(address);

		// deposits must be bigger
		oldAccumulators.totalDeposits.assertLessThan(update.newIoMapTotalDeposits);
		const delta = update.newIoMapTotalDeposits.sub(oldAccumulators.totalDeposits);
		// deposit amount must be less or equal to the delta
		update.collateralDelta.assertLessThanOrEqual(delta);

    // update the map
    this.update(address.key, new IOAccumulators({
      totalDeposits: update.newIoMapTotalDeposits,
      totalWithdrawals: oldAccumulators.totalWithdrawals,
    }).pack());

    return this.getRoot();
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
  static fromSerialized(data: SerializableMapData): IoMap {
    return super.fromSerialized(data) as IoMap;
  }
}

export class PrunedIoMap extends PrunedMapBase {
  constructor(data: SerializableMapData) {
    super(new IoMapBase(), data);
  }

  /**
   * Create a PrunedZkUsdMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): PrunedIoMap {
    if (!IoMapBase.verifyIntegrity(data)) {
      throw new Error('Invalid serialized data for PrunedIoMap');
    }
    return new PrunedIoMap(data);
  }
}
