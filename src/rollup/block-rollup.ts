import { Bool, DynamicProof, FeatureFlags, Field, Poseidon, SelfProof, VerificationKey, ZkProgram } from "o1js";
import { FizkRollupState } from "../domain/rollup-state.js";
import { BlockCommitment } from "./block-commitment.js";
import { GenesisProgramProof } from "./genesis-program.js";
import { VkhMap } from "../domain/governance/vkh-map.js";


export class FizkStateUpdateProof extends DynamicProof<FizkRollupState, FizkRollupState> {
    static publicInputType = FizkRollupState;
    static publicOutputType = FizkRollupState;
    static maxProofsVerified = 0 as const;
    static featureFlags = FeatureFlags.allNone; // should allow FizkStateUpdateRollup proofs
}

export const BlockRollup = ZkProgram({
    name: 'block-rollup',
    publicInput: BlockCommitment,
    publicOutput: BlockCommitment,
    methods: {
        // pre-verifies properties to the initial state via GenesisProgram.
        genesis: {
            privateInputs: [FizkRollupState, GenesisProgramProof],
            async method(publicInput: BlockCommitment, initialState:FizkRollupState, genesisProgramProof: GenesisProgramProof){
                genesisProgramProof.verify();

                const outputBlockCommitment = BlockCommitment.build(initialState);
                const programInputHash = Poseidon.hash(genesisProgramProof.publicInput.initialState.toFields());
                const initialStateHash = Poseidon.hash(initialState.toFields());
                programInputHash.assertEquals(initialStateHash);

                //not really necessary:
                publicInput.equals(outputBlockCommitment);
                
                return {publicOutput: outputBlockCommitment}
            }
        },
        // attaches rolled-up fizk state update (block) to the existing block rollup
        rollupStateUpdate: {
            privateInputs: [SelfProof, FizkStateUpdateProof, VerificationKey, VkhMap],
            async method(publicInput: BlockCommitment, blockRollupProof:SelfProof<BlockCommitment, BlockCommitment>, stateUpdateProof: FizkStateUpdateProof, verificationKey: VerificationKey, vkhMap: VkhMap): Promise<{ publicOutput: BlockCommitment }> {

                // pin public input
                publicInput.equals(blockRollupProof.publicInput).assertTrue();

                // verify that the states are matching
                const currentBlockCommitment = BlockCommitment.build(stateUpdateProof.publicInput);
                currentBlockCommitment.equals(blockRollupProof.publicOutput).assertTrue();

                // verify proofs
                blockRollupProof.verify()
                stateUpdateProof.verify(verificationKey);

                // verify verification key matches the expected one
                vkhMap.root.assertEquals(stateUpdateProof.publicInput.rollupVerificationState.rollupLogicVerification.otherVkhMerkleRoot);
                vkhMap.assertIncluded(verificationKey.hash);

                // build the output block commitment and return it
                const outputBlockCommitment = BlockCommitment.build(stateUpdateProof.publicOutput);

                // there should be one block diffrence
                outputBlockCommitment.blockNumber.equals(currentBlockCommitment.blockNumber.add(1));

                return {publicOutput: outputBlockCommitment}
            }
        },
        // merges two block rollups if their connecting block state match.
        merge: {
            privateInputs: [SelfProof, SelfProof],
            publicInput: BlockCommitment,
            async method(publicInput: BlockCommitment, blockRollupProof1:SelfProof<BlockCommitment, BlockCommitment>, blockRollupProof2: SelfProof<BlockCommitment,BlockCommitment>): Promise<{ publicOutput: BlockCommitment }> {
                blockRollupProof1.verify();
                blockRollupProof2.verify();

                // pin public input
                publicInput.equals(blockRollupProof1.publicInput).assertTrue();

                // verify that proofs are matching
                blockRollupProof2.publicOutput.equals(blockRollupProof2.publicInput).assertTrue();

                return {publicOutput: blockRollupProof2.publicOutput}
            }
        }
    }
})