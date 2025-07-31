import { ZkProgram, DynamicProof, FeatureFlags, Field, Struct, UInt64 } from "o1js";
import { FizkTokenTransferPreconditions, FizkTokenTransferPublicOutput} from "./common.js";
import { ClonedFizkTokenMap, VerifiedFizkTokenUpdates } from "../../domain/fizk-token/fizk-token-map.js";
import { ProofVerification, verifyDynamicProof, VkhMap } from "../../domain/governance/vkh-map.js";
import { FizkAddStakePreconditions, FizkAddStakePublicOutput } from "./stake.js";
import { FizkMapValue } from "../../domain/fizk-token/fizk-map-value.js";
import { OutputNoteCommitments } from "../../domain/zkusd/zkusd-note.js";
import { MerkleRoot } from "../../core/map/merkle-root.js";

export class FizkWrapupPreconditions extends Struct({
  currentRewardIndex: UInt64,
  totalAmountStaked: UInt64,
  vkhMapRoot: MerkleRoot<VkhMap>,
}) {}

export class FizkWrapupPublicOutput extends Struct({
    verifiedFizkTokenUpdates: VerifiedFizkTokenUpdates,
    outputNoteCommitments: OutputNoteCommitments,
}) {}   

export class FizkAddStakeIntentDynamicProof extends DynamicProof<FizkAddStakePreconditions, FizkAddStakePublicOutput> {
    static publicInputType = FizkAddStakePreconditions;
    static publicOutputType = FizkAddStakePublicOutput;
    static maxProofsVerified = 0 as const;
    static featureFlags = FeatureFlags.allNone;
}   

export class FizkAddStakePrivateInput extends Struct({
    intentProof: FizkAddStakeIntentDynamicProof,
    proofVerification: ProofVerification,
    fizkTokenMap: ClonedFizkTokenMap,
}) {}


export const FizkTokenIntentWrapper = ZkProgram({
    name: 'FizkTokenIntentWrapper',
    publicInput: FizkWrapupPreconditions,
    publicOutput: FizkWrapupPublicOutput,
    methods: {
        // transfer: {
        //     privateInputs: [FizkTokenTransferPrivateInput],
        //     async method(publicInput: FizkWrapupPreconditions, privateInput: FizkTokenTransferPrivateInput): Promise<{ publicOutput: VerifiedFizkTokenUpdates }> {
        //         return Promise.resolve(transferFizkToken(publicInput, privateInput));
        //     }
        // }

        addStake: {
            privateInputs: [FizkAddStakePrivateInput],
            async method(publicInput: FizkWrapupPreconditions, privateInput: FizkAddStakePrivateInput): Promise<{ publicOutput: FizkWrapupPublicOutput }> {
                // -- verify proof preconditions
                // get the fizk map value
                const fizkMapValue = FizkMapValue.unpack(privateInput.fizkTokenMap.get(privateInput.intentProof.publicOutput.addStakeUpdate.to.value));
                const amountStaked = fizkMapValue.amountStaked;
                const rewardIndexSnapshot = fizkMapValue.globalGovRewardIndexSnapshot;

                const preconditions = privateInput.intentProof.publicInput;
                preconditions.totalAmountStaked.assertEquals(publicInput.totalAmountStaked);
                preconditions.globalGovRewardIndexSnapshot.assertEquals(rewardIndexSnapshot);
                preconditions.amountStaked.assertEquals(amountStaked);
                preconditions.currentGlobalGovRewardIndex.assertEquals(publicInput.currentRewardIndex);

                // verify proof
                verifyDynamicProof(privateInput.intentProof, privateInput.proofVerification, publicInput.vkhMapRoot);

                // process updates using the clone of the map
                const addStakeUpdate = privateInput.intentProof.publicOutput.addStakeUpdate;
                const outputNoteCommitment = privateInput.intentProof.publicOutput.outputNoteCommitment;
                const outputNoteCommitments = OutputNoteCommitments.empty();
                outputNoteCommitments.commitments[0] = outputNoteCommitment;
                
                const verifiedFizkTokenUpdates = ClonedFizkTokenMap.verifyAddStakeUpdate(privateInput.fizkTokenMap as ClonedFizkTokenMap, addStakeUpdate, publicInput.currentRewardIndex);
                
                return { publicOutput: { verifiedFizkTokenUpdates, outputNoteCommitments } };
            }
        }
    }
})

export class FizkTokenIntentWrapperProof extends ZkProgram.Proof(FizkTokenIntentWrapper) {}

const flags = FeatureFlags.allNone;
export class FizkTokenIntentWrapperDynamicProof extends DynamicProof<FizkTokenTransferPreconditions, FizkTokenTransferPublicOutput> {
  static publicInputType = FizkTokenTransferPreconditions;
  static publicOutputType = FizkTokenTransferPublicOutput;
  static maxProofsVerified = 0 as const;
  static featureFlags = flags;
}