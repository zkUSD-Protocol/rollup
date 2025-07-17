import {
  createSerializableIndexedMap,
  SerializableMapData,
} from '../../core/map/serializable-indexed-map.js';
import { MapPruner, PruningRequest } from '../../core/map/map-pruner.js';
import { PrunedMapBase } from '../../core/map/pruned-map-base.js'

const INTENT_INCLUSION_MAP_HEIGHT = 14; // 4,503,599,627,370,496 - 4.5 quadrillion

// Create base serializable map
const IntentInclusionMapBase = createSerializableIndexedMap(INTENT_INCLUSION_MAP_HEIGHT);

export class IntentInclusionMap extends IntentInclusionMapBase {
  /**
   * Create a pruned version of this map
   */
  createPruned(request: PruningRequest): PrunedIntentInclusionMap {
    const prunedData = MapPruner.createPrunedData(this, request);
    return new PrunedIntentInclusionMap(prunedData);
  }

  /**
   * Estimate pruning efficiency
   */
  estimatePruningEfficiency(request: PruningRequest) {
    return MapPruner.estimatePruningEfficiency(this, request);
  }

  /**
   * Create a IntentInclusionMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): IntentInclusionMap {
    return super.fromSerialized(data) as IntentInclusionMap;
  }

}

export class PrunedIntentInclusionMap extends PrunedMapBase {
  constructor(data: SerializableMapData) {
    super(new IntentInclusionMapBase(), data);
  }

  /**
   * Create a PrunedIntentInclusionMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): PrunedIntentInclusionMap {
    if (!IntentInclusionMapBase.verifyIntegrity(data)) {
      throw new Error('Invalid serialized data for PrunedIntentInclusionMap');
    }
    return new PrunedIntentInclusionMap(data);
  }
}
