import {
  createSerializableIndexedMap,
  SerializableMapData,
} from '../../core/map/serializable-indexed-map.js';
import { MapPruner, PruningRequest } from '../../core/map/map-pruner.js';
import { PrunedMapBase } from '../../core/map/pruned-map-base.js'
import { MerkleRoot } from '../../core/map/merkle-root.js';
import { Field } from 'o1js';

const BRIDGE_MAP_HEIGHT = 11; // 1024

// Create base serializable map
const BridgeMapBase = createSerializableIndexedMap(BRIDGE_MAP_HEIGHT);

export class BridgeMap extends BridgeMapBase {
  /**
   * Create a pruned version of this map
   */
  createPruned(request: PruningRequest): PrunedBridgeMap {
    const prunedData = MapPruner.createPrunedData(this, request);
    return new PrunedBridgeMap(prunedData);
  }

  /**
   * Get the root of the map
   */
  getRoot(): MerkleRoot<BridgeMap> {
    return new MerkleRoot({ root: this.root });
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
  static fromSerialized(data: SerializableMapData): BridgeMap {
    return super.fromSerialized(data) as BridgeMap;
  }
}

export class PrunedBridgeMap extends PrunedMapBase {
  constructor(data: SerializableMapData) {
    super(new BridgeMapBase(), data);
  }

  /**
   * Create a PrunedBridgeMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): PrunedBridgeMap {
    if (!BridgeMapBase.verifyIntegrity(data)) {
      throw new Error('Invalid serialized data for PrunedBridgeMap');
    }
    return new PrunedBridgeMap(data);
  }
}
