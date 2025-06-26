import {
  createSerializableIndexedMap,
  SerializableMapData,
} from '../../core/map/serializable-indexed-map.js';
import { MapPruner, PruningRequest } from '../../core/map/map-pruner.js';
import { PrunedMapBase } from '../../core/map/pruned-map-base.js'
import { Field } from 'o1js';
import { MerkleRoot } from '../../core/map/merkle-root.js';

const COUNCIL_MEMBER_MAP_HEIGHT = 6; // 2**(6-1) = 32

// Create base serializable map
const CouncilMemberMapBase = createSerializableIndexedMap(COUNCIL_MEMBER_MAP_HEIGHT);

export class CouncilMemberMap extends CouncilMemberMapBase {
  /**
   * Create a pruned version of this map
   */
  createPruned(request: PruningRequest): PrunedCouncilMemberMap {
    const prunedData = MapPruner.createPrunedData(this, request);
    return new PrunedCouncilMemberMap(prunedData);
  }

  /**
   * Get the root of the map
   */
  getRoot(): MerkleRoot<CouncilMemberMap, any> {
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
  static fromSerialized(data: SerializableMapData): CouncilMemberMap {
    return super.fromSerialized(data) as CouncilMemberMap;
  }

}

export class PrunedCouncilMemberMap extends PrunedMapBase {
  constructor(data: SerializableMapData) {
    super(new CouncilMemberMapBase(), data);
  }

  /**
   * Create a PrunedFizkMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): PrunedCouncilMemberMap {
    if (!CouncilMemberMapBase.verifyIntegrity(data)) {
      throw new Error('Invalid serialized data for PrunedCouncilMemberMap');
    }
    return new PrunedCouncilMemberMap(data);
  }
}
