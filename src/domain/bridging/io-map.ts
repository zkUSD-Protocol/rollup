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
import { VerifiedMapUpdate } from '../vault/vault-map.js';
import { Field, Struct, UInt64 } from 'o1js';
import { BridgeBackIntentUpdate, BridgeIntentUpdate } from './io-map-update.js';

const IO_MAP_HEIGHT = 52; // 4,503,599,627,370,496 - 4.5 quadrillion

// Create base serializable map
const IoMapBase = createSerializableIndexedMap(IO_MAP_HEIGHT);

export class VerifiedAccumulatorsUpdate extends Struct({
  vaultAddress: VaultAddress,
  newIoAccumulatorsState: IOAccumulators,
}) {}


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

  createAccumulatorsForAddress(address: VaultAddress): MerkleRoot<IoMap> {
    const io = new IOAccumulators({
      totalDeposits: UInt64.from(0),
      totalWithdrawals: UInt64.from(0),
    });
    this.insert(address.key, io.pack());
    return this.getRoot();
  }

  verifiedUpdate(update: VerifiedAccumulatorsUpdate): MerkleRoot<IoMap> {
    this.update(update.vaultAddress.key, update.newIoAccumulatorsState.pack());
    return this.getRoot();
  }

  verifyWithdraw(update: RedeemIntentUpdate): VerifiedAccumulatorsUpdate {
    const oldAccumulators = this.getAccumulators(update.vaultAddress);

    return new VerifiedAccumulatorsUpdate({
      vaultAddress: update.vaultAddress,
      newIoAccumulatorsState: new IOAccumulators({
        totalDeposits: oldAccumulators.totalDeposits,
        totalWithdrawals: oldAccumulators.totalWithdrawals.add(update.collateralDelta),
      }),
    });
  }

  verifyBridge(update: BridgeIntentUpdate): VerifiedAccumulatorsUpdate {
    const oldAccumulators = this.getAccumulators(update.vaultAddress);

    return new VerifiedAccumulatorsUpdate({
      vaultAddress: update.vaultAddress,
      newIoAccumulatorsState: new IOAccumulators({
        totalDeposits: oldAccumulators.totalDeposits.add(update.amount),
        totalWithdrawals: oldAccumulators.totalWithdrawals,
      }),
    });
  }

  verifyBridgeBack(update: BridgeBackIntentUpdate): VerifiedAccumulatorsUpdate {
    const oldAccumulators = this.getAccumulators(update.vaultAddress);

    return new VerifiedAccumulatorsUpdate({
      vaultAddress: update.vaultAddress,
      newIoAccumulatorsState: new IOAccumulators({
        totalDeposits: oldAccumulators.totalDeposits.sub(update.amount),
        totalWithdrawals: oldAccumulators.totalWithdrawals,
      }),
    });
  }

  verifyDeposit(update: DepositIntentUpdate): VerifiedAccumulatorsUpdate{
    const oldAccumulators = this.getAccumulators(update.vaultAddress);

		// deposits must be bigger
		oldAccumulators.totalDeposits.assertLessThan(update.newIoMapTotalDeposits);
		const delta = update.newIoMapTotalDeposits.sub(oldAccumulators.totalDeposits);
		// deposit amount must be less or equal to the delta
		update.collateralDelta.assertLessThanOrEqual(delta);

    return new VerifiedAccumulatorsUpdate({
      vaultAddress: update.vaultAddress,
      newIoAccumulatorsState: new IOAccumulators({
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
