import { ZkProgram, FeatureFlags, Field, Struct, UInt64, DynamicProof } from "o1js";
import { FizkTokenMap, VerifiedFizkTokenUpdates } from "../../domain/fizk-token/fizk-token-map.js";
import { ProofVerification, verifyDynamicProof, VkhMap } from "../../domain/governance/vkh-map.js";
import { FizkAddStakePreconditions, FizkAddStakePublicOutput } from "./stake.js";
import { FizkMapValue } from "../../domain/fizk-token/fizk-map-value.js";
import { OutputNoteCommitments } from "../../domain/zkusd/zkusd-note.js";
import { MerkleRoot } from "../../core/map/merkle-root.js";
import { UInt50, } from "../../core/uint50.js";
import { Timestamp } from "../../core/timestamp.js";
import { Ratio32 } from "../../core/ratio.js";
import { InterBlockUInt64 } from "../../core/inter-block.js";
import { FizkTransferPreconditions } from "./transfer.js";

export class FizkWrapupPreconditions extends Struct({
  currentTimestamp: Timestamp,
  currentRewardIndex: InterBlockUInt64,
  totalAmountStaked: InterBlockUInt64,
  vkhMapRoot: MerkleRoot<VkhMap>,
  stakeWithdrawalFee: Ratio32,
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
    fizkTokenMap: FizkTokenMap,
}) {}

export class FizkModifyWithdrawalPrivateInput extends Struct({
    intentProof: FizkAddStakeIntentDynamicProof,
    proofVerification: ProofVerification,
    fizkTokenMap: FizkTokenMap,
}) {}

export class FizkModifyWithdrawalPublicOutput extends Struct({
    verifiedFizkTokenUpdates: VerifiedFizkTokenUpdates,
    outputNoteCommitments: OutputNoteCommitments,
    totalAmountStaked: UInt64,
}) {}

export class FizkTransferPrivateInput extends Struct({
    intentProof: FizkAddStakeIntentDynamicProof,
    proofVerification: ProofVerification,
    fizkTokenMap: FizkTokenMap,
}) {}

export class FizkWithdrawUnlockedPrivateInput extends Struct({
    intentProof: FizkAddStakeIntentDynamicProof,
    proofVerification: ProofVerification,
    fizkTokenMap: FizkTokenMap,
}) {}

export class FizkWithdrawUnlockedPublicOutput extends Struct({
    verifiedFizkTokenUpdates: VerifiedFizkTokenUpdates,
    outputNoteCommitments: OutputNoteCommitments,
    totalAmountStaked: UInt64,
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

                const preconditions: FizkTransferPreconditions = privateInput.intentProof.publicInput;
                const preconditionsHoldCurrent = preconditions.totalAmountStaked.equals(publicInput.totalAmountStaked.current)
                .and(preconditions.currentGlobalGovRewardIndex.equals(publicInput.currentRewardIndex.current))

                const preconditionsHoldPrevious = preconditions.totalAmountStaked.equals(publicInput.totalAmountStaked.previous)
                .and(preconditions.currentGlobalGovRewardIndex.equals(publicInput.currentRewardIndex.previous))

                preconditionsHoldCurrent.or(preconditionsHoldPrevious)
                .and(preconditions.globalGovRewardIndexSnapshot.equals(rewardIndexSnapshot))
                .and(preconditions.amountStaked.value.equals(amountStaked.value))

                // verify proof
                verifyDynamicProof(privateInput.intentProof, privateInput.proofVerification, publicInput.vkhMapRoot);

                // process updates using the clone of the map
                const transferUpdate = privateInput.intentProof.publicOutput.transferUpdate;
                const outputNoteCommitment = privateInput.intentProof.publicOutput.rewardOutputNoteCommitment;
                const outputNoteCommitments = OutputNoteCommitments.empty();
                outputNoteCommitments.commitments[0] = outputNoteCommitment;
                
                const verifiedFizkTokenUpdates = FizkTokenMap.verifyTransfer(privateInput.fizkTokenMap as FizkTokenMap, transferUpdate);
                
                return { publicOutput: { verifiedFizkTokenUpdates, outputNoteCommitments, totalAmountStaked: publicInput.totalAmountStaked.current } };
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

                const preconditionsHoldCurrent = preconditions.totalAmountStaked.equals(publicInput.totalAmountStaked.current)
                .and(preconditions.currentGlobalGovRewardIndex.equals(publicInput.currentRewardIndex.current))

                const preconditionsHoldPrevious = preconditions.totalAmountStaked.equals(publicInput.totalAmountStaked.previous)
                .and(preconditions.currentGlobalGovRewardIndex.equals(publicInput.currentRewardIndex.previous))

                preconditionsHoldCurrent.or(preconditionsHoldPrevious)
                .and(preconditions.globalGovRewardIndexSnapshot.equals(rewardIndexSnapshot))
                .and(preconditions.amountStaked.value.equals(amountStaked.value))

                // verify proof
                verifyDynamicProof(privateInput.intentProof, privateInput.proofVerification, publicInput.vkhMapRoot);

                // process updates using the clone of the map
                const modifyWithdrawalUpdate = privateInput.intentProof.publicOutput.modifyWithdrawalUpdate;
                const outputNoteCommitment = privateInput.intentProof.publicOutput.outputNoteCommitment;
                const outputNoteCommitments = OutputNoteCommitments.empty();
                outputNoteCommitments.commitments[0] = outputNoteCommitment;
                
                const verifiedFizkTokenUpdates = FizkTokenMap.verifyModifyWithdrawalUpdate(privateInput.fizkTokenMap as FizkTokenMap, modifyWithdrawalUpdate);
                
                const totalAmountStaked: UInt64 = UInt50.toUInt64(amountStaked).add(UInt50.toUInt64(modifyWithdrawalUpdate.amount));
                
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
                const preconditionsHoldCurrent = preconditions.totalAmountStaked.equals(publicInput.totalAmountStaked.current)
                .and(preconditions.currentGlobalGovRewardIndex.equals(publicInput.currentRewardIndex.current))

                const preconditionsHoldPrevious = preconditions.totalAmountStaked.equals(publicInput.totalAmountStaked.previous)
                .and(preconditions.currentGlobalGovRewardIndex.equals(publicInput.currentRewardIndex.previous))

                preconditionsHoldCurrent.or(preconditionsHoldPrevious)
                .and(preconditions.globalGovRewardIndexSnapshot.equals(rewardIndexSnapshot))
                .and(preconditions.amountStaked.value.equals(amountStaked.value))

                // verify proof
                verifyDynamicProof(privateInput.intentProof, privateInput.proofVerification, publicInput.vkhMapRoot);

                // process updates using the clone of the map
                const addStakeUpdate = privateInput.intentProof.publicOutput.addStakeUpdate;
                const outputNoteCommitment = privateInput.intentProof.publicOutput.outputNoteCommitment;
                const outputNoteCommitments = OutputNoteCommitments.empty();
                outputNoteCommitments.commitments[0] = outputNoteCommitment;
                
                const verifiedFizkTokenUpdates = FizkTokenMap.verifyAddStakeUpdate(privateInput.fizkTokenMap as FizkTokenMap, addStakeUpdate);
                
                const totalAmountStaked: UInt64 = UInt50.toUInt64(amountStaked).add(UInt50.toUInt64(addStakeUpdate.amount));
                
                return { publicOutput: { verifiedFizkTokenUpdates, outputNoteCommitments, totalAmountStaked } };
            }
        },

        withdrawUnlocked: {
            privateInputs: [FizkWithdrawUnlockedPrivateInput],
            async method(publicInput: FizkWrapupPreconditions, privateInput: FizkWithdrawUnlockedPrivateInput): Promise<{ publicOutput: FizkWrapupPublicOutput }> {
                // -- verify proof preconditions
                // get the fizk map value
                const fizkMapValue = FizkMapValue.unpack(privateInput.fizkTokenMap.get(privateInput.intentProof.publicOutput.withdrawUnlockedUpdate.target.value));
                const amountStaked = fizkMapValue.amountStaked;
                const rewardIndexSnapshot = fizkMapValue.globalGovRewardIndexSnapshot;

                const preconditions = privateInput.intentProof.publicInput;
                const preconditionsHoldCurrent = preconditions.totalAmountStaked.equals(publicInput.totalAmountStaked.current)
                .and(preconditions.currentGlobalGovRewardIndex.equals(publicInput.currentRewardIndex.current))

                const preconditionsHoldPrevious = preconditions.totalAmountStaked.equals(publicInput.totalAmountStaked.previous)
                .and(preconditions.currentGlobalGovRewardIndex.equals(publicInput.currentRewardIndex.previous))

                preconditionsHoldCurrent.or(preconditionsHoldPrevious)
                .and(preconditions.globalGovRewardIndexSnapshot.equals(rewardIndexSnapshot))
                .and(preconditions.amountStaked.value.equals(amountStaked.value))

                // verify proof
                verifyDynamicProof(privateInput.intentProof, privateInput.proofVerification, publicInput.vkhMapRoot);

                // process updates using the clone of the map
                const withdrawUnlockedUpdate = privateInput.intentProof.publicOutput.withdrawUnlockedUpdate;
                const outputNoteCommitment = privateInput.intentProof.publicOutput.outputNoteCommitment;
                const outputNoteCommitments = OutputNoteCommitments.empty();
                outputNoteCommitments.commitments[0] = outputNoteCommitment;
                
                const verifiedFizkTokenUpdates = FizkTokenMap.verifyWithdrawUnlockedUpdate(privateInput.fizkTokenMap as FizkTokenMap, withdrawUnlockedUpdate, publicInput.currentTimestamp, publicInput.stakeWithdrawalFee);
                
                const totalAmountStaked: UInt64 = UInt50.toUInt64(amountStaked).sub(UInt50.toUInt64(withdrawUnlockedUpdate.amount));
                
                return { publicOutput: { verifiedFizkTokenUpdates, outputNoteCommitments, totalAmountStaked } };
            }
        }  
    }
})

export class FizkTokenIntentWrapperProof extends ZkProgram.Proof(FizkTokenIntentWrapper) {}
