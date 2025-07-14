import {
  createSerializableIndexedMap,
  SerializableMapData,
} from '../../core/map/serializable-indexed-map.js';
import { MapPruner, PruningRequest } from '../../core/map/map-pruner.js';
import { PrunedMapBase } from '../../core/map/pruned-map-base.js'
import { MerkleRoot } from '../../core/map/merkle-root.js';

const PROPOSAL_MAP_HEIGHT = 52; // 4,503,599,627,370,496 - 4.5 quadrillion

// Create base serializable map
const ProposalMapBase = createSerializableIndexedMap(PROPOSAL_MAP_HEIGHT);

export class ProposalMap extends ProposalMapBase {
  /**
   * Create a pruned version of this map
   */
  createPruned(request: PruningRequest): PrunedProposalMap {
    const prunedData = MapPruner.createPrunedData(this, request);
    return new PrunedProposalMap(prunedData);
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
  static fromSerialized(data: SerializableMapData): ProposalMap {
    return super.fromSerialized(data) as ProposalMap;
  }

}

export class PrunedProposalMap extends PrunedMapBase {
  constructor(data: SerializableMapData) {
    super(new ProposalMapBase(), data);
  }

  /**
   * Create a PrunedFizkMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): PrunedProposalMap {
    if (!ProposalMapBase.verifyIntegrity(data)) {
      throw new Error('Invalid serialized data for PrunedProposalMap');
    }
    return new PrunedProposalMap(data);
  }
}
