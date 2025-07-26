import {
  createSerializableIndexedMap,
  SerializableMapData,
} from '../../core/map/serializable-indexed-map.js';
import { MapPruner, PruningRequest } from '../../core/map/map-pruner.js';
import { PrunedMapBase } from '../../core/map/pruned-map-base.js'
import { MerkleRoot } from '../../core/map/merkle-root.js';
import { FizkTokenState } from './fizk-token-state.js';
import { FizkTokenUpdate, FizkTokenUpdates } from './fizk-token-update.js';
import { Struct } from 'o1js';
import { FizkMapValue } from './fizk-map-value.js';

const FIZK_MAP_HEIGHT = 52; // 4,503,599,627,370,496 - 4.5 quadrillion

// Create base serializable map
const FizkTokenMapBase = createSerializableIndexedMap(FIZK_MAP_HEIGHT);

export class VerfiedFizkTokenUpdate {
    update: FizkTokenUpdate;
}

// they must be applicable without issues to the current state of map
export class VerifiedFizkTokenUpdates extends Struct({
  applicableMapRoot: MerkleRoot<FizkTokenMap>,
  updates: FizkTokenUpdates,
}) {

  static Length = FizkTokenUpdates.Length;
}

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
  static getRoot(map: FizkTokenMap): MerkleRoot<FizkTokenMap> {
    return new MerkleRoot({ root: map.root });
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

  verifyAndUpdate(_state: FizkTokenState, _update: FizkTokenUpdate) {
  }

  static applyVerifiedUpdates(map: FizkTokenMap, verifiedUpdates: VerifiedFizkTokenUpdates): MerkleRoot<FizkTokenMap>{
    map.root.assertEquals(verifiedUpdates.applicableMapRoot.root);
    for(let i = 0; i < VerifiedFizkTokenUpdates.Length; i++){
      const update = verifiedUpdates.updates.updates[i];
      map.setIf(update.isNotDummy, update.address.address, FizkMapValue.pack(update.value));
    }
    return new MerkleRoot({ root: map.root });
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
