import { DynamicProof, FeatureFlags, Field, MerkleWitness, SelfProof, Struct, UInt64, VerificationKey, ZkProgram } from "o1js";
import { ComputationStepOutput } from "./computation/common.js";
  
class SingleComputationProof extends DynamicProof<Field, ComputationStepOutput> {
  static publicInputType = Field;
  static publicOutputType = ComputationStepOutput;
  static maxProofsVerified = 0 as const;

  static featureFlags = FeatureFlags.allMaybe;
}

const ComputationVkhTreeHeight = 10;
class ComputationVkhWitness extends MerkleWitness(ComputationVkhTreeHeight) {}

export class FizkRollupStateCommitment extends Struct({
  stateCommitment: Field,
  computationVkHTreeRoot: Field,
  rollupLength: UInt64,
}) {}

export class FizkStateComputationWitness extends Struct({
  proof: SingleComputationProof,
  verificationKey: VerificationKey,
  vkhWitness: ComputationVkhWitness,
}) {}
  
export const FizkRollup = ZkProgram({
  name: "FizkRollup",
  publicInput: FizkRollupStateCommitment,
  publicOutput: FizkRollupStateCommitment,
  methods: {
    proveSingleComputationTransition: {
      privateInputs: [FizkStateComputationWitness],
      async method(
        publicInput: FizkRollupStateCommitment,
        witness: FizkStateComputationWitness,
      ): Promise<{ publicOutput: FizkRollupStateCommitment }> {
        witness.proof.verify(witness.verificationKey);
        const computedRoot = witness.vkhWitness.calculateRoot(witness.verificationKey.hash);
        computedRoot.assertEquals(publicInput.computationVkHTreeRoot)
        const newStateCommitment = new FizkRollupStateCommitment({
          rollupLength: publicInput.rollupLength.add(1),
          stateCommitment: witness.proof.publicOutput.fizkStateCommitment,
          computationVkHTreeRoot: witness.proof.publicOutput.computationVkHTreeRoot,
        })
        witness.proof.publicInput.assertEquals(publicInput.stateCommitment)
        return { publicOutput: newStateCommitment };
      },
    },
    merge: {
      privateInputs: [SelfProof<FizkRollupStateCommitment, FizkRollupStateCommitment>, SelfProof<FizkRollupStateCommitment, FizkRollupStateCommitment>],
      async method(
        publicInput: FizkRollupStateCommitment,
        proof1: SelfProof<FizkRollupStateCommitment, FizkRollupStateCommitment>,
        proof2: SelfProof<FizkRollupStateCommitment, FizkRollupStateCommitment>,
      ): Promise<{ publicOutput: FizkRollupStateCommitment }> {
        proof1.verify();
        proof2.verify();

        publicInput.stateCommitment.assertEquals(proof1.publicInput.stateCommitment)
        publicInput.computationVkHTreeRoot.assertEquals(proof1.publicInput.computationVkHTreeRoot)
        publicInput.rollupLength.assertEquals(proof1.publicInput.rollupLength)

        proof1.publicOutput.computationVkHTreeRoot.assertEquals(proof2.publicInput.computationVkHTreeRoot)
        proof1.publicOutput.stateCommitment.assertEquals(proof2.publicInput.stateCommitment)
        proof1.publicOutput.rollupLength.assertEquals(proof2.publicInput.rollupLength)
        
        const newStateCommitment = new FizkRollupStateCommitment({
          stateCommitment: proof2.publicOutput.stateCommitment,
          computationVkHTreeRoot: proof2.publicOutput.computationVkHTreeRoot,
          rollupLength: proof2.publicOutput.rollupLength.add(1),
        })
        
        return { publicOutput: newStateCommitment };
      },
    },
  }
});