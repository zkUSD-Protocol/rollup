import {
  createSerializableIndexedMap,
  SerializableMapData,
} from '../../core/map/serializable-indexed-map.js';
import { MapPruner, PruningRequest } from '../../core/map/map-pruner.js';
import { PrunedMapBase } from '../../core/map/pruned-map-base.js'
import { Field } from 'o1js';
import { MerkleRoot } from '../../core/map/merkle-root.js';

const STAKE_MAP_HEIGHT = 52; // 4,503,599,627,370,496 - 4.5 quadrillion

// Create base serializable map
const StakeMapBase = createSerializableIndexedMap(STAKE_MAP_HEIGHT);

export class StakeMap extends StakeMapBase {
  /**
   * Create a pruned version of this map
   */
  createPruned(request: PruningRequest): PrunedStakeMap {
    const prunedData = MapPruner.createPrunedData(this, request);
    return new PrunedStakeMap(prunedData);
  }

  /**
   * Get the root of the map
   */
  getRoot(): MerkleRoot<StakeMap, any> {
    return new MerkleRoot({ root: this.root });
  }

  /**
   * Estimate pruning efficiency
   */
  estimatePruningEfficiency(request: PruningRequest) {
    return MapPruner.estimatePruningEfficiency(this, request);
  }

  /**
   * Create a FizkMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): StakeMap {
    return super.fromSerialized(data) as StakeMap;
  }

}

export class PrunedStakeMap extends PrunedMapBase {
  constructor(data: SerializableMapData) {
    super(new StakeMapBase(), data);
  }

  /**
   * Create a PrunedFizkMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): PrunedStakeMap {
    if (!StakeMapBase.verifyIntegrity(data)) {
      throw new Error('Invalid serialized data for PrunedStakeMap');
    }
    return new PrunedStakeMap(data);
  }
}
