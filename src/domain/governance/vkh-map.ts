import {
  createSerializableIndexedMap,
  SerializableMapData,
} from '../../core/map/serializable-indexed-map.js';
import { MapPruner, PruningRequest } from '../../core/map/map-pruner.js';
import { PrunedMapBase } from '../../core/map/pruned-map-base.js'
import { getRoot, MerkleRoot } from '../../core/map/merkle-root.js';
import { DynamicProof, Field, Struct, VerificationKey } from 'o1js';

const VKH_MAP_HEIGHT = 10; // 512

// Create base serializable map
const VkhMapBase = createSerializableIndexedMap(VKH_MAP_HEIGHT);

export class VkhMap extends VkhMapBase {
  static stateUpdateProgramVkhKey: Field = new Field(1)
  static councilMultisigVkhKey: Field = new Field(2)
  /**
   * Create a pruned version of this map
   */
  createPruned(request: PruningRequest): PrunedVkhMap {
    const prunedData = MapPruner.createPrunedData(this, request);
    return new PrunedVkhMap(prunedData);
  }

  /**
   * Get the root of the map
   */
  getRoot(): MerkleRoot<VkhMap> {
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
  static fromSerialized(data: SerializableMapData): VkhMap {
    return super.fromSerialized(data) as VkhMap;
  }

}

export class PrunedVkhMap extends PrunedMapBase {
  constructor(data: SerializableMapData) {
    super(new VkhMapBase(), data);
  }

  /**
   * Create a PrunedFizkMap from serialized data
   */
  static fromSerialized(data: SerializableMapData): PrunedVkhMap {
    if (!VkhMapBase.verifyIntegrity(data)) {
      throw new Error('Invalid serialized data for PrunedVkhMap');
    }
    return new PrunedVkhMap(data);
  }
}


export class ProofVerification extends Struct({
  verificationKey: VerificationKey,
  vkhKey: Field,
  vkhMap: VkhMap,
}) {}

// verifies a dynamic proof against a vkh map with a given root
export function verifyDynamicProof<
  T extends DynamicProof<any, any>
>(
  proof: T,
  proofVerification: ProofVerification, 
  assertedVkhRoot: MerkleRoot<VkhMap>,
): void {
  proof.verify(proofVerification.verificationKey);
  proofVerification.vkhMap.get(proofVerification.vkhKey).assertEquals(proofVerification.verificationKey.hash);
  assertedVkhRoot.assertEquals(getRoot(proofVerification.vkhMap) as MerkleRoot<VkhMap>);
}