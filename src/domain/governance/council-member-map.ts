import {
  createSerializableIndexedMap,
  SerializableMapData,
} from '../../core/map/serializable-indexed-map.js';
import { MapPruner, PruningRequest } from '../../core/map/map-pruner.js';
import { PrunedMapBase } from '../../core/map/pruned-map-base.js'
import { MerkleRoot } from '../../core/map/merkle-root.js';
import { Bool, Field, Gadgets, Poseidon, Provable, PublicKey, UInt8 } from 'o1js';
import { BitArrayValue } from '../../core/bit-array-value.js';
import { MAX_COUNCIL_SIZE } from './constants.js';

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
  getRoot(): MerkleRoot<CouncilMemberMap> {
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

  static containsPublicKey(map: CouncilMemberMap, publicKey: PublicKey, seatIndex: UInt8): Bool {
    const bitArrayValue = BitArrayValue.fromBitIndexWitness(seatIndex);
    const hash = Poseidon.hash([...publicKey.toFields(), bitArrayValue.value]);
    return map.getOption(hash).isSome;
  }

  static assertPubkeyIncluded(map: CouncilMemberMap, publicKey: PublicKey, seatIndex: UInt8): BitArrayValue {
    const bitArrayValue = BitArrayValue.fromBitIndexWitness(seatIndex);
    const hash = Poseidon.hash([...publicKey.toFields(), bitArrayValue.value]);
    map.assertIncluded(hash);

    // check if the value is from a single bit
    // for more security
    const a=bitArrayValue.value;
    a.greaterThan(Field(0)).and(Gadgets.and(a, a.sub(1), MAX_COUNCIL_SIZE).equals(Field(0))).assertTrue();
    
    return bitArrayValue;
  }

  public static countBits(x: Field): UInt8 {
    const bits = x.toBits();
    let voteCount = Field.from(0);
    for (let i = 0; i < MAX_COUNCIL_SIZE; i++) {
      voteCount = Provable.if(bits[i], voteCount.add(1), voteCount);
    }
    const ret = UInt8.Unsafe.fromField(voteCount);
    return ret;
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
