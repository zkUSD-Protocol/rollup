import {
  createSerializableIndexedMap,
  SerializableMapData,
} from '../../core/map/serializable-indexed-map.js';
import { MapPruner, PruningRequest } from '../../core/map/map-pruner.js';
import { PrunedMapBase } from '../../core/map/pruned-map-base.js'
import { MerkleRoot } from '../../core/map/merkle-root.js';
import { ZkUsdState } from './zkusd-state.js';
import { ZkUsdUpdate } from './zkusd-update.js';
import { MAX_INPUT_NOTE_COUNT, MAX_OUTPUT_NOTE_COUNT, Nullifier } from './zkusd-note.js';

const ZKUSD_MAP_HEIGHT = 52; // 4,503,599,627,370,496 - 4.5 quadrillion

// Create base serializable map
const ZkUsdMapBase = createSerializableIndexedMap(ZKUSD_MAP_HEIGHT);

export class ZkUsdMap extends ZkUsdMapBase {
  /**
   * Create a pruned version of this map
   */
  createPruned(request: PruningRequest): PrunedZkUsdMap {
    const prunedData = MapPruner.createPrunedData(this, request);
    return new PrunedZkUsdMap(prunedData);
  }

  /**
   * Get the root of the map
   */
  getRoot(): MerkleRoot<ZkUsdMap> {
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
  static fromSerialized(data: SerializableMapData): ZkUsdMap {
    return super.fromSerialized(data) as ZkUsdMap;
  }

  verifyAndUpdate(state: ZkUsdState, update: ZkUsdUpdate) {
        const { nullifiers, outputNoteCommitments } = update;

        
        // the map root should be the same as the zkusd live root
        this.getRoot().assertEquals(state.zkUsdMapRoot);

        for (let i = 0; i < MAX_INPUT_NOTE_COUNT; i++) {
          const nullifier = nullifiers.nullifiers[i];
          this.assertNotIncluded(nullifier.nullifier);
          this.setIf(
            nullifier.isDummy.not(),
            nullifier.nullifier,
            Nullifier.included()
          );
        }

        for (let i = 0; i < MAX_OUTPUT_NOTE_COUNT; i++) {
          const outputNoteCommitment = outputNoteCommitments.commitments[i];
          this.assertNotIncluded(outputNoteCommitment.commitment);
          this.setIf(
            outputNoteCommitment.isDummy.not(),
            outputNoteCommitment.commitment,
            Nullifier.included()
          );
        }
      }
  }

export class PrunedZkUsdMap extends PrunedMapBase {
  constructor(data: SerializableMapData) {
    super(new ZkUsdMapBase(), data);
  }

  /**
   * Create a PrunedZkUsdMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): PrunedZkUsdMap {
    if (!ZkUsdMapBase.verifyIntegrity(data)) {
      throw new Error('Invalid serialized data for PrunedZkUsdMap');
    }
    return new PrunedZkUsdMap(data);
  }
}
