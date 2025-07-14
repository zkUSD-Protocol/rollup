import {
  createSerializableIndexedMap,
  SerializableMapData,
} from '../../core/map/serializable-indexed-map.js';
import { MapPruner, PruningRequest } from '../../core/map/map-pruner.js';
import { PrunedMapBase } from '../../core/map/pruned-map-base.js'
import { MerkleRoot } from '../../core/map/merkle-root.js';
import { BlockInfoState } from './block-info-state.js';

const HISTORICAL_BLOCK_STATE_MAP_HEIGHT = 52; // 4,503,599,627,370,496 - 4.5 quadrillion

// Create base serializable map
const HistoricalBlockStateMapBase = createSerializableIndexedMap(HISTORICAL_BLOCK_STATE_MAP_HEIGHT);

export class HistoricalBlockStateMap extends HistoricalBlockStateMapBase {
  /**
   * Create a pruned version of this map
   */
  createPruned(request: PruningRequest): PrunedHistoricalBlockStateMap {
    const prunedData = MapPruner.createPrunedData(this, request);
    return new PrunedHistoricalBlockStateMap(prunedData);
  }

  /**
   * Estimate pruning efficiency
   */
  estimatePruningEfficiency(request: PruningRequest) {
    return MapPruner.estimatePruningEfficiency(this, request);
  }

  /**
   * Create a HistoricalBlockStateMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): HistoricalBlockStateMap {
    return super.fromSerialized(data) as HistoricalBlockStateMap;
  }

  verifyAndUpdate(_state: BlockInfoState, _update: BlockInfoState) {
  }
}

export class PrunedHistoricalBlockStateMap extends PrunedMapBase {
  constructor(data: SerializableMapData) {
    super(new HistoricalBlockStateMapBase(), data);
  }

  /**
   * Create a PrunedHistoricalBlockStateMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): PrunedHistoricalBlockStateMap {
    if (!HistoricalBlockStateMapBase.verifyIntegrity(data)) {
      throw new Error('Invalid serialized data for PrunedHistoricalBlockStateMap');
    }
    return new PrunedHistoricalBlockStateMap(data);
  }
}
