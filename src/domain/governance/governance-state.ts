import { Field, PublicKey, Struct, UInt64, UInt8 } from "o1js";
import { ProposalMap } from "./proposal-map.js";
import { MerkleRoot, RollupRoots } from "../../core/map/merkle-root.js";
import { StakeMap } from "./stake-map.js";
import { CouncilMemberMap } from "./council-member-map.js";


export class GovernanceState extends Struct({
    forp: UInt64,
    
    councilMembersMerkleRoot: MerkleRoot<CouncilMemberMap,'live'>,
    councilSeatsSignatureTreshold: UInt8,
    assemblyProposalThreshold: UInt64,
    assemblyProposalVetoThreshold: UInt64,
    
    minaSettlementKey: PublicKey,

    globalGovRewardIndex: UInt64,
    totalAmountStaked: UInt64,

    proposalMapRoot: RollupRoots<ProposalMap>(),
    stakeMapRoot: RollupRoots<StakeMap>(),
    
}) {
    toFields(): Field[] {
        return [
            this.forp.value,
            this.councilMembersMerkleRoot.root,
            this.councilSeatsSignatureTreshold.value,
            this.assemblyProposalThreshold.value,
            this.assemblyProposalVetoThreshold.value,
            ...this.minaSettlementKey.toFields(),
            this.globalGovRewardIndex.value,
            this.totalAmountStaked.value,
            this.proposalMapRoot.intentRoot.root,
            this.proposalMapRoot.liveRoot.root,
            this.stakeMapRoot.intentRoot.root,
            this.stakeMapRoot.liveRoot.root,
        ];
    }
}