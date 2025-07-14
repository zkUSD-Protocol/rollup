import {
  createSerializableIndexedMap,
  SerializableMapData,
} from '../../core/map/serializable-indexed-map.js';
import { MapPruner, PruningRequest } from '../../core/map/map-pruner.js';
import { PrunedMapBase } from '../../core/map/pruned-map-base.js'
import { MerkleRoot } from '../../core/map/merkle-root.js';
import { Provable, Struct } from 'o1js';
import { BridgeBackIntentUpdate, BridgeSendIntentUpdate } from './io-map-update.js';
import { BridgeIoAccumulators } from './bridge-io-accumulators.js';
import { BridgedAddress } from './bridged-address.js';

const IO_MAP_HEIGHT = 52; // 4,503,599,627,370,496 - 4.5 quadrillion

// Create base serializable map
const BridgeIoMapBase = createSerializableIndexedMap(IO_MAP_HEIGHT);


export class VerifiedBridgeMapUpdate extends Struct({
  bridgedAddress: BridgedAddress,
  newIoAccumulatorsState: BridgeIoAccumulators,
}) {}


export class BridgeIoMap extends BridgeIoMapBase {
  /**
   * Create a pruned version of this map
   */
  createPruned(request: PruningRequest): PrunedBridgeIoMap {
    const prunedData = MapPruner.createPrunedData(this, request);
    return new PrunedBridgeIoMap(prunedData);
  }

  /**
   * Get the root of the map
   */
  getRoot(): MerkleRoot<BridgeIoMap> {
    return new MerkleRoot({ root: this.root });
  }

  getAccumulators(address: BridgedAddress): BridgeIoAccumulators {
    // get option
    const option = this.getOption(address.key);
    const accumulators = Provable.if(option.isSome, 
                                     BridgeIoAccumulators.unpack(option.value),
                                     BridgeIoAccumulators.empty());
    return accumulators;
  }

  verifiedSet(update: VerifiedBridgeMapUpdate): MerkleRoot<BridgeIoMap> {
    this.set(update.bridgedAddress.key, update.newIoAccumulatorsState.pack());
    return this.getRoot();
  }


  verifyBridgeSendIntent(update: BridgeSendIntentUpdate): VerifiedBridgeMapUpdate{
    const oldAccumulators = this.getAccumulators(update.bridgedAddress);

    return new VerifiedBridgeMapUpdate({
      bridgedAddress: update.bridgedAddress,
      newIoAccumulatorsState: new BridgeIoAccumulators({
        totalBurned: oldAccumulators.totalBurned.add(update.rollupJustBurned),
        totalMinted: oldAccumulators.totalMinted,
      }),
    });
  }

  verifyBridgeReceiveIntent(update: BridgeBackIntentUpdate): VerifiedBridgeMapUpdate {
    const oldAccumulators = this.getAccumulators(update.bridgedAddress);
    
    oldAccumulators.totalMinted.assertLessThan(update.bridgeTotalBurned);
    const delta = update.bridgeTotalBurned.sub(oldAccumulators.totalMinted);
    update.mintAmount.assertLessThanOrEqual(delta);

    return new VerifiedBridgeMapUpdate({
      bridgedAddress: update.bridgedAddress,
      newIoAccumulatorsState: new BridgeIoAccumulators({
        totalBurned: oldAccumulators.totalBurned,
        totalMinted: oldAccumulators.totalMinted.add(update.mintAmount),
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
  static fromSerialized(data: SerializableMapData): BridgeIoMap {
    return super.fromSerialized(data) as BridgeIoMap;
  }
}

export class PrunedBridgeIoMap extends PrunedMapBase {
  constructor(data: SerializableMapData) {
    super(new BridgeIoMapBase(), data);
  }

  /**
   * Create a PrunedZkUsdMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): PrunedBridgeIoMap {
    if (!BridgeIoMapBase.verifyIntegrity(data)) {
      throw new Error('Invalid serialized data for PrunedBridgeIoMap');
    }
    return new PrunedBridgeIoMap(data);
  }
}
