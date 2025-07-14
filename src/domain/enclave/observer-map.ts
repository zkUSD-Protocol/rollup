import {
  createSerializableIndexedMap,
  SerializableMapData,
} from '../../core/map/serializable-indexed-map.js';
import { MapPruner, PruningRequest } from '../../core/map/map-pruner.js';
import { PrunedMapBase } from '../../core/map/pruned-map-base.js'
import { MerkleRoot } from '../../core/map/merkle-root.js';
import { Field } from 'o1js';

const OBSERVER_MAP_HEIGHT = 5; // 16

// Create base serializable map
const ObserverMapBase = createSerializableIndexedMap(OBSERVER_MAP_HEIGHT);

export class ObserverMap extends ObserverMapBase {
  /**
   * Create a pruned version of this map
   */
  createPruned(request: PruningRequest): PrunedObserverMap {
    const prunedData = MapPruner.createPrunedData(this, request);
    return new PrunedObserverMap(prunedData);
  }

  /**
   * Get the root of the map
   */
  getRoot(): MerkleRoot<ObserverMap> {
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
  static fromSerialized(data: SerializableMapData): ObserverMap {
    return super.fromSerialized(data) as ObserverMap;
  }
}

export class PrunedObserverMap extends PrunedMapBase {
  constructor(data: SerializableMapData) {
    super(new ObserverMapBase(), data);
  }

  /**
   * Create a PrunedObserverMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): PrunedObserverMap {
    if (!ObserverMapBase.verifyIntegrity(data)) {
      throw new Error('Invalid serialized data for PrunedObserverMap');
    }
    return new PrunedObserverMap(data);
  }
}
