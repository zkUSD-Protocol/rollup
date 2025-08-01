import { ZkProgram, DynamicProof, FeatureFlags, Field, Struct, UInt64 } from "o1js";
import { FizkTokenTransferPreconditions, FizkTokenTransferPublicOutput} from "./common.js";
import { ClonedFizkTokenMap, VerifiedFizkTokenUpdates } from "../../domain/fizk-token/fizk-token-map.js";
import { ProofVerification, verifyDynamicProof, VkhMap } from "../../domain/governance/vkh-map.js";
import { FizkAddStakePreconditions, FizkAddStakePublicOutput } from "./stake.js";
import { FizkMapValue } from "../../domain/fizk-token/fizk-map-value.js";
import { OutputNoteCommitments } from "../../domain/zkusd/zkusd-note.js";
import { MerkleRoot } from "../../core/map/merkle-root.js";
import { uint50toUint64 } from "../../core/uint50.js";

export class FizkWrapupPreconditions extends Struct({
  currentRewardIndex: UInt64,
  totalAmountStaked: UInt64,
  vkhMapRoot: MerkleRoot<VkhMap>,
}) {}

export class FizkWrapupPublicOutput extends Struct({
    verifiedFizkTokenUpdates: VerifiedFizkTokenUpdates,
    outputNoteCommitments: OutputNoteCommitments,
    totalAmountStaked: UInt64,
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

export class FizkModifyWithdrawalPrivateInput extends Struct({
    intentProof: FizkAddStakeIntentDynamicProof,
    proofVerification: ProofVerification,
    fizkTokenMap: ClonedFizkTokenMap,
}) {}

export class FizkModifyWithdrawalPublicOutput extends Struct({
    verifiedFizkTokenUpdates: VerifiedFizkTokenUpdates,
    outputNoteCommitments: OutputNoteCommitments,
    totalAmountStaked: UInt64,
}) {}

export class FizkTransferPrivateInput extends Struct({
    intentProof: FizkAddStakeIntentDynamicProof,
    proofVerification: ProofVerification,
    fizkTokenMap: ClonedFizkTokenMap,
}) {}


export const FizkTokenIntentWrapper = ZkProgram({
    name: 'FizkTokenIntentWrapper',
    publicInput: FizkWrapupPreconditions,
    publicOutput: FizkWrapupPublicOutput,
    methods: {
        transfer:{
            privateInputs: [FizkTransferPrivateInput],
            async method(publicInput: FizkWrapupPreconditions, privateInput: FizkTransferPrivateInput): Promise<{ publicOutput: FizkWrapupPublicOutput }> {
                // -- verify proof preconditions
                // get the fizk map value
                const fizkMapValue = FizkMapValue.unpack(privateInput.fizkTokenMap.get(privateInput.intentProof.publicOutput.transferUpdate.from.value));
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
                const transferUpdate = privateInput.intentProof.publicOutput.transferUpdate;
                const outputNoteCommitment = privateInput.intentProof.publicOutput.rewardOutputNoteCommitment;
                const outputNoteCommitments = OutputNoteCommitments.empty();
                outputNoteCommitments.commitments[0] = outputNoteCommitment;
                
                const verifiedFizkTokenUpdates = ClonedFizkTokenMap.verifyTransfer(privateInput.fizkTokenMap as ClonedFizkTokenMap, transferUpdate);
                
                return { publicOutput: { verifiedFizkTokenUpdates, outputNoteCommitments, totalAmountStaked: publicInput.totalAmountStaked } };
            }
        },

        modifyWithdrawal:{
            privateInputs: [FizkModifyWithdrawalPrivateInput],
            async method(publicInput: FizkWrapupPreconditions, privateInput: FizkModifyWithdrawalPrivateInput): Promise<{ publicOutput: FizkWrapupPublicOutput }> {
                // -- verify proof preconditions
                // get the fizk map value
                const fizkMapValue = FizkMapValue.unpack(privateInput.fizkTokenMap.get(privateInput.intentProof.publicOutput.modifyWithdrawalUpdate.target.value));
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
                const modifyWithdrawalUpdate = privateInput.intentProof.publicOutput.modifyWithdrawalUpdate;
                const outputNoteCommitment = privateInput.intentProof.publicOutput.outputNoteCommitment;
                const outputNoteCommitments = OutputNoteCommitments.empty();
                outputNoteCommitments.commitments[0] = outputNoteCommitment;
                
                const verifiedFizkTokenUpdates = ClonedFizkTokenMap.verifyModifyWithdrawalUpdate(privateInput.fizkTokenMap as ClonedFizkTokenMap, modifyWithdrawalUpdate);
                
                const totalAmountStaked: UInt64 = uint50toUint64(amountStaked).add(uint50toUint64(modifyWithdrawalUpdate.amount));
                
                return { publicOutput: { verifiedFizkTokenUpdates, outputNoteCommitments, totalAmountStaked } };
            }
        },


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
                
                const verifiedFizkTokenUpdates = ClonedFizkTokenMap.verifyAddStakeUpdate(privateInput.fizkTokenMap as ClonedFizkTokenMap, addStakeUpdate);
                
                const totalAmountStaked: UInt64 = uint50toUint64(amountStaked).add(uint50toUint64(addStakeUpdate.amount));
                
                return { publicOutput: { verifiedFizkTokenUpdates, outputNoteCommitments, totalAmountStaked } };
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
