import { Field, PublicKey, Struct, UInt32, UInt64, UInt8 } from "o1js";
import { ProposalMap } from "./proposal-map.js";
import { MerkleRoot } from "../../core/map/merkle-root.js";
import { StakeMap } from "./stake-map.js";
import { CouncilMemberMap } from "./council-member-map.js";
import { BridgeMap } from "../bridging/bridge-map.js";


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
    totalAmountStaked: UInt64,

    proposalMapRoot: MerkleRoot<ProposalMap>,
    lastProposalIndex: Field,
    stakeMapRoot: MerkleRoot<StakeMap>,
    
    bridgeMapRoot: MerkleRoot<BridgeMap>,
    observersMultiSigTreshold: UInt32,
    
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
            totalAmountStaked: this.totalAmountStaked,
            proposalMapRoot: this.proposalMapRoot,
            lastProposalIndex: this.lastProposalIndex,
            stakeMapRoot: this.stakeMapRoot,
            bridgeMapRoot: this.bridgeMapRoot,
            observersMultiSigTreshold: this.observersMultiSigTreshold,
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
        ];
    }
}