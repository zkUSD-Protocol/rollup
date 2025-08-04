import { Field, PublicKey, Struct, UInt32, UInt64, UInt8 } from "o1js";
import { ProposalMap } from "./proposal-map.js";
import { MerkleRoot } from "../../core/map/merkle-root.js";
import { CouncilMemberMap } from "./council-member-map.js";
import { BridgeMap } from "../bridging/bridge-map.js";
import { VkhMap } from "./vkh-map.js";
import { Ratio32 } from "../../core/ratio.js";
import { InterBlockUInt64 } from "../../core/inter-block.js";

// todo should it also gather all the parameters or be 
// focused on the state of the governance only?
export class GovernanceState extends Struct({
    forp: UInt64,
    
    councilMembersMerkleRoot: MerkleRoot<CouncilMemberMap>,
    councilSeatsSignatureThreshold: UInt8,
    assemblyProposalThreshold: UInt64,
    assemblyProposalVetoThreshold: UInt64,
    proposalExecutionDelayMillis: UInt64,
    proposalSnapshotValidityMillis: UInt64,
    
    minaSettlementKey: PublicKey,

    globalGovRewardIndex: InterBlockUInt64,

    proposalMapRoot: MerkleRoot<ProposalMap>,
    lastProposalIndex: Field,
    
    bridgeMapRoot: MerkleRoot<BridgeMap>,
    observersMultiSigTreshold: UInt32,

    rollupProgramsVkhMapRoot: MerkleRoot<VkhMap>,

    // stake related
    totalAmountStaked: UInt64,
    stakeWithdrawalFee: Ratio32,
    
}) {
    toFields(): Field[] {
        // Ensure globalGovRewardIndex is properly typed as InterBlockUInt64
        const globalGovRewardIndex = this.globalGovRewardIndex as { previous: UInt64, current: UInt64 };
        
        return [
            this.forp.value,
            this.councilMembersMerkleRoot.root,
            this.councilSeatsSignatureThreshold.value,
            this.assemblyProposalThreshold.value,
            this.assemblyProposalVetoThreshold.value,
            this.proposalExecutionDelayMillis.value,
            this.proposalSnapshotValidityMillis.value,
            ...this.minaSettlementKey.toFields(),
            globalGovRewardIndex.previous.value,
            globalGovRewardIndex.current.value,
            this.totalAmountStaked.value,
            this.proposalMapRoot.root,
            this.lastProposalIndex,
            this.bridgeMapRoot.root,
            this.observersMultiSigTreshold.value,
            this.rollupProgramsVkhMapRoot.root,
            this.totalAmountStaked.value,
            this.stakeWithdrawalFee.num.value,
        ];
    }

    applyUpdate(update: GovernanceStateUpdate): GovernanceState {
        return new GovernanceState({
            forp: update.forp,
            councilMembersMerkleRoot: update.councilMembersMerkleRoot,
            councilSeatsSignatureThreshold: update.councilSeatsSignatureTreshold,
            assemblyProposalThreshold: update.assemblyProposalThreshold,
            assemblyProposalVetoThreshold: update.assemblyProposalVetoThreshold,
            proposalExecutionDelayMillis: update.proposalExecutionDelayMillis,
            proposalSnapshotValidityMillis: update.proposalSnapshotValidityMillis,
            minaSettlementKey: update.minaSettlementKey,
            globalGovRewardIndex: update.globalGovRewardIndex,
            proposalMapRoot: this.proposalMapRoot,
            lastProposalIndex: this.lastProposalIndex,
            bridgeMapRoot: this.bridgeMapRoot,
            observersMultiSigTreshold: this.observersMultiSigTreshold,
            rollupProgramsVkhMapRoot: this.rollupProgramsVkhMapRoot,
            totalAmountStaked: this.totalAmountStaked,
            stakeWithdrawalFee: this.stakeWithdrawalFee,
        });
    }
}
export class GovernanceStateUpdate extends Struct({
    forp: UInt64,
    
    councilMembersMerkleRoot: MerkleRoot<CouncilMemberMap>,
    councilSeatsSignatureTreshold: UInt8,
    assemblyProposalThreshold: UInt64,
    assemblyProposalVetoThreshold: UInt64,
    proposalExecutionDelayMillis: UInt64,
    proposalSnapshotValidityMillis: UInt64,
    
    minaSettlementKey: PublicKey,

    globalGovRewardIndex: InterBlockUInt64,
    
    bridgeMapRoot: MerkleRoot<BridgeMap>,
    observersMultiSigTreshold: UInt8,
    rollupProgramsVkhMapRoot: MerkleRoot<VkhMap>,
    totalAmountStaked: InterBlockUInt64,
    stakeWithdrawalFee: Ratio32,
}) {
    toFields(): Field[] {
        // todo does this work?
        const globalGovRewardIndex = this.globalGovRewardIndex as { previous: UInt64, current: UInt64 };
        const totalAmountStaked = this.totalAmountStaked as { previous: UInt64, current: UInt64 };
        return [
            this.forp.value,
            this.councilMembersMerkleRoot.root,
            this.councilSeatsSignatureTreshold.value,
            this.assemblyProposalThreshold.value,
            this.assemblyProposalVetoThreshold.value,
            this.proposalExecutionDelayMillis.value,
            this.proposalSnapshotValidityMillis.value,
            ...this.minaSettlementKey.toFields(),
            globalGovRewardIndex.previous.value,
            globalGovRewardIndex.current.value,
            this.bridgeMapRoot.root,
            this.observersMultiSigTreshold.value,
            this.rollupProgramsVkhMapRoot.root,
            totalAmountStaked.previous.value,
            totalAmountStaked.current.value,
            this.stakeWithdrawalFee.num.value,
        ];
    }
}