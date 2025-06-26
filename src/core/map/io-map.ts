import {
  createSerializableIndexedMap,
  SerializableMapData,
} from './serializable-indexed-map.js';
import { MapPruner, PruningRequest } from './map-pruner.js';
import { PrunedMapBase } from './pruned-map-base.js'
import { Field, Struct } from 'o1js';
import { MerkleRoot } from './merkle-root.js';

const IO_MAP_HEIGHT = 52; // 4,503,599,627,370,496 - 4.5 quadrillion

// Create base serializable map
const IoMapBase = createSerializableIndexedMap(IO_MAP_HEIGHT);

export class IoMap extends IoMapBase {
  /**
   * Create a pruned version of this map
   */
  createPruned(request: PruningRequest): PrunedIoMap {
    const prunedData = MapPruner.createPrunedData(this, request);
    return new PrunedIoMap(prunedData);
  }

  /**
   * Get the root of the map
   */
  getRoot(): MerkleRoot<IoMap, any> {
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
  static fromSerialized(data: SerializableMapData): IoMap {
    return super.fromSerialized(data) as IoMap;
  }
}

export class PrunedIoMap extends PrunedMapBase {
  constructor(data: SerializableMapData) {
    super(new IoMapBase(), data);
  }

  /**
   * Create a PrunedZkUsdMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): PrunedIoMap {
    if (!IoMapBase.verifyIntegrity(data)) {
      throw new Error('Invalid serialized data for PrunedIoMap');
    }
    return new PrunedIoMap(data);
  }
}
