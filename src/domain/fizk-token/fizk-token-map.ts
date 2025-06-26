import {
  createSerializableIndexedMap,
  SerializableMapData,
} from '../../core/map/serializable-indexed-map.js';
import { MapPruner, PruningRequest } from '../../core/map/map-pruner.js';
import { PrunedMapBase } from '../../core/map/pruned-map-base.js'
import { Field } from 'o1js';
import { MerkleRoot } from '../../core/map/merkle-root.js';
import { FizkTokenState } from './fizk-token-state.js';
import { FizkTokenUpdate } from './fizk-token-update.js';

const FIZK_MAP_HEIGHT = 52; // 4,503,599,627,370,496 - 4.5 quadrillion

// Create base serializable map
const FizkTokenMapBase = createSerializableIndexedMap(FIZK_MAP_HEIGHT);

export class FizkTokenMap extends FizkTokenMapBase {
  /**
   * Create a pruned version of this map
   */
  createPruned(request: PruningRequest): PrunedFizkTokenMap {
    const prunedData = MapPruner.createPrunedData(this, request);
    return new PrunedFizkTokenMap(prunedData);
  }

  /**
   * Get the root of the map
   */
  getRoot(): MerkleRoot<FizkTokenMap, any> {
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
  static fromSerialized(data: SerializableMapData): FizkTokenMap {
    return super.fromSerialized(data) as FizkTokenMap;
  }

  verifyAndUpdate(state: FizkTokenState, update: FizkTokenUpdate) {
  }
}

export class PrunedFizkTokenMap extends PrunedMapBase {
  constructor(data: SerializableMapData) {
    super(new FizkTokenMapBase(), data);
  }

  /**
   * Create a PrunedFizkMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): PrunedFizkTokenMap {
    if (!FizkTokenMapBase.verifyIntegrity(data)) {
      throw new Error('Invalid serialized data for PrunedFizkTokenMap');
    }
    return new PrunedFizkTokenMap(data);
  }
}
