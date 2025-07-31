import { Field, PublicKey, Struct, UInt32, UInt64, UInt8 } from "o1js";
import { ProposalMap } from "./proposal-map.js";
import { MerkleRoot } from "../../core/map/merkle-root.js";
import { StakeMap } from "./stake-map.js";
import { CouncilMemberMap } from "./council-member-map.js";
import { BridgeMap } from "../bridging/bridge-map.js";
import { VkhMap } from "./vkh-map.js";

// todo should it also gather all the parameters or be 
// focused on the state of the governance only?
export class GovernanceState extends Struct({
    forp: UInt64,
    
    councilMembersMerkleRoot: MerkleRoot<CouncilMemberMap>,
    councilSeatsSignatureTreshold: UInt8,
    assemblyProposalThreshold: UInt64,
    assemblyProposalVetoThreshold: UInt64,
    proposalExecutionDelayMillis: UInt64,
    proposalSnapshotValidityMillis: UInt64,
    
    minaSettlementKey: PublicKey,

    globalGovRewardIndex: UInt64,

    proposalMapRoot: MerkleRoot<ProposalMap>,
    lastProposalIndex: Field,
    stakeMapRoot: MerkleRoot<StakeMap>,
    
    bridgeMapRoot: MerkleRoot<BridgeMap>,
    observersMultiSigTreshold: UInt32,

    rollupProgramsVkhMapRoot: MerkleRoot<VkhMap>,

    // stake related
    totalAmountStaked: UInt64,
    stakeWithdrawalFee: UInt64,
    
}) {
    toFields(): Field[] {
        return [
            this.forp.value,
            this.councilMembersMerkleRoot.root,
            this.councilSeatsSignatureTreshold.value,
            this.assemblyProposalThreshold.value,
            this.assemblyProposalVetoThreshold.value,
            this.proposalExecutionDelayMillis.value,
            this.proposalSnapshotValidityMillis.value,
            ...this.minaSettlementKey.toFields(),
            this.globalGovRewardIndex.value,
            this.totalAmountStaked.value,
            this.proposalMapRoot.root,
            this.lastProposalIndex,
            this.stakeMapRoot.root,
            this.bridgeMapRoot.root,
            this.observersMultiSigTreshold.value,
            this.rollupProgramsVkhMapRoot.root,
            this.totalAmountStaked.value,
            this.stakeWithdrawalFee.value,
        ];
    }

    applyUpdate(update: GovernanceStateUpdate): GovernanceState {
        return new GovernanceState({
            forp: update.forp,
            councilMembersMerkleRoot: update.councilMembersMerkleRoot,
            councilSeatsSignatureTreshold: update.councilSeatsSignatureTreshold,
            assemblyProposalThreshold: update.assemblyProposalThreshold,
            assemblyProposalVetoThreshold: update.assemblyProposalVetoThreshold,
            proposalExecutionDelayMillis: update.proposalExecutionDelayMillis,
            proposalSnapshotValidityMillis: update.proposalSnapshotValidityMillis,
            minaSettlementKey: update.minaSettlementKey,
            globalGovRewardIndex: update.globalGovRewardIndex,
            proposalMapRoot: this.proposalMapRoot,
            lastProposalIndex: this.lastProposalIndex,
            stakeMapRoot: this.stakeMapRoot,
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

    globalGovRewardIndex: UInt64,
    
    bridgeMapRoot: MerkleRoot<BridgeMap>,
    observersMultiSigTreshold: UInt8,
    rollupProgramsVkhMapRoot: MerkleRoot<VkhMap>,
    totalAmountStaked: UInt64,
    stakeWithdrawalFee: UInt64,
}) {
    toFields(): Field[] {
        return [
            this.forp.value,
            this.councilMembersMerkleRoot.root,
            this.councilSeatsSignatureTreshold.value,
            this.assemblyProposalThreshold.value,
            this.assemblyProposalVetoThreshold.value,
            this.proposalExecutionDelayMillis.value,
            this.proposalSnapshotValidityMillis.value,
            ...this.minaSettlementKey.toFields(),
            this.globalGovRewardIndex.value,
            this.bridgeMapRoot.root,
            this.observersMultiSigTreshold.value,
            this.rollupProgramsVkhMapRoot.root,
            this.totalAmountStaked.value,
            this.stakeWithdrawalFee.value,
        ];
    }
}