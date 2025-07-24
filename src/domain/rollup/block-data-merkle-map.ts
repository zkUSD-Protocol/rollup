import {
  createSerializableIndexedMap,
  SerializableMapData,
} from '../../core/map/serializable-indexed-map.js';
import { MapPruner, PruningRequest } from '../../core/map/map-pruner.js';
import { PrunedMapBase } from '../../core/map/pruned-map-base.js'
import { Field } from 'o1js';
import { BlockDataMap as Constants} from "./block-data-merkle-map-constants.js"

// Create base serializable map
const BlockDataMerkleMapBase = createSerializableIndexedMap(Constants.Height);

export class BlockDataMap extends BlockDataMerkleMapBase {
    
  /**
   * Create a pruned version of this map
   */
  createPruned(request: PruningRequest): PrunedBlockDataMap {
    const prunedData = MapPruner.createPrunedData(this, request);
    return new PrunedBlockDataMap(prunedData);
  }

  /**
   * Estimate pruning efficiency
   */
  estimatePruningEfficiency(request: PruningRequest) {
    return MapPruner.estimatePruningEfficiency(this, request);
  }

  /**
   * Create a BlockDataMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): BlockDataMap {
    return super.fromSerialized(data) as BlockDataMap;
  }

}

export class PrunedBlockDataMap extends PrunedMapBase {
  constructor(data: SerializableMapData) {
    super(new BlockDataMerkleMapBase(), data);
  }

  /**
   * Create a PrunedBlockDataMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): PrunedBlockDataMap {
    if (!BlockDataMerkleMapBase.verifyIntegrity(data)) {
      throw new Error('Invalid serialized data for PrunedIntentInclusionMap');
    }
    return new PrunedBlockDataMap(data);
  }
}
