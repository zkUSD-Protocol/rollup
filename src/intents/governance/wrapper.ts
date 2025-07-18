
// now we do wrap up, which is another intent level that combines the two actions

import { Bool, Field, Poseidon, Struct, UInt64, UInt8, ZkProgram, DynamicProof, FeatureFlags } from "o1js";
import { GovernanceAction1IntentProof } from "./action1.js";
import { GovernanceAction2IntentProof } from "./action2.js";
import { VaultParameters } from "../../domain/vault/vault.js";
import { ZkusdEnclavesState } from "../../domain/enclave/zskud-enclaves-state.js";
import { GlobalParametersState } from "../../domain/global-parameters/global-parameters-state.js";
import { GovernanceStateUpdate } from "../../domain/governance/governance-state.js";
import { RegulatoryState } from "../../domain/regulatory/regulatory-state.js";
import { MerkleRoot } from "../../core/map/merkle-root.js";
import { ProposalMap } from "../../domain/governance/proposal-map.js";
import { HistoricalBlockStateMap } from "../../domain/block-info/historical-block-state-map.js";
import { BlockInfoState } from "../../domain/block-info/block-info-state.js";

export class GovActionIntentAction1PrivateInput extends Struct({
	proof: GovernanceAction1IntentProof,
}) {}

export class GovActionIntentAction2PrivateInput extends Struct({
	proof: GovernanceAction2IntentProof,
}) {}

// public inputs and output

export class GovActionIntentInput extends Struct({
}) {}

export class GovSystemUpdate extends Struct({
	minaVaultParamsUpdate: VaultParameters,
	applyMinaVaultParamsUpdate: Bool, // if this is false, then ignore the update
	suiVaultParamsUpdate: VaultParameters,
	applySuiVaultParamsUpdate: Bool, 
	enclaveStateUpdate: ZkusdEnclavesState,
	applyEnclaveStateUpdate: Bool,
	globalParametersStateUpdate: GlobalParametersState,
	applyGlobalParametersStateUpdate: Bool,
	governanceStateUpdate: GovernanceStateUpdate,
	applyGovernanceStateUpdate: Bool,
	regulatoryStateUpdate: RegulatoryState,
	applyRegulatoryStateUpdate: Bool,
}) {
	toFields(): Field[] {
		return [
			...this.minaVaultParamsUpdate.toFields(),
			this.applyMinaVaultParamsUpdate.toField(),
			...this.suiVaultParamsUpdate.toFields(),
			this.applySuiVaultParamsUpdate.toField(),
			...this.enclaveStateUpdate.toFields(),
			this.applyEnclaveStateUpdate.toField(),
			...this.globalParametersStateUpdate.toFields(),
			this.applyGlobalParametersStateUpdate.toField(),
			...this.governanceStateUpdate.toFields(),
			this.applyGovernanceStateUpdate.toField(),
			...this.regulatoryStateUpdate.toFields(),
			this.applyRegulatoryStateUpdate.toField(),
		];
	}
}

export class GovActionType extends Struct({
	enum: UInt8,
}) {
	static createProposal = new GovActionType({ enum: UInt8.from(0) });
	static executeUpdate = new GovActionType({ enum: UInt8.from(1) });
	static vetoProposal = new GovActionType({ enum: UInt8.from(2) });

	toFields(): Field[] {
		return [this.enum.value];
	}

	assertEquals(other: GovActionType) {
		this.enum.assertEquals(other.enum);
	}
}


export class GovProposalStatus extends Struct({
	enum: UInt8,
}) {
	static pending = new GovProposalStatus({ enum: UInt8.from(0) });
	static executed = new GovProposalStatus({ enum: UInt8.from(1) });
	static vetoed = new GovProposalStatus({ enum: UInt8.from(2) });

	toFields(): Field[] {
		return [this.enum.value];
	}

	assertEquals(other: GovProposalStatus) {
		this.enum.assertEquals(other.enum);
	}
}

export class GovProposal extends Struct({
	govSystemUpdate: GovSystemUpdate, // the update that the proposal will execute
	proposalSnapshotBlockInfo: BlockInfoState, // the voting happen against stake root of this block
}) {}

export class GovProposalIncluded extends Struct({
	proposal: GovProposal,
	proposalIndex: Field,
	proposalInclusionBlockInfo: BlockInfoState
}) {}

export class GovActionIntentOutput extends Struct({
	proposal: GovProposal,
	govSystemUpdate: GovSystemUpdate,
	// --
	govActionType: GovActionType,
	proposalIndex: Field,
	proposalInclusionBlockInfo: BlockInfoState
}) {

}

export function proposalInclusionCommitmentForStatus(govProposal: GovProposal, proposalIndex: Field, proposalInclusionBlockInfo: BlockInfoState, status: GovProposalStatus): Field {
	const fields = [
		...govProposal.govSystemUpdate.toFields(),
		proposalIndex,
		...proposalInclusionBlockInfo.toFields(),
		status.enum.value,
		]
		return Poseidon.hash(fields);
	}





export const GovActionIntent = ZkProgram({
	name: 'GovActionIntent',
	publicInput: GovActionIntentInput,
	publicOutput: GovActionIntentOutput,
	methods: {
		
		createProposal: {
			privateInputs: [GovActionIntentAction1PrivateInput],
			async method(publicInput: GovActionIntentInput, privateInput: GovActionIntentAction1PrivateInput): Promise<{ publicOutput: GovActionIntentOutput }> {
				privateInput.proof.verify();	
				const ret = GovActionIntentOutput.empty();
				ret.govActionType = GovActionType.createProposal;
				return { publicOutput: ret }
			}
		},
		
		action1: {
			privateInputs: [GovActionIntentAction1PrivateInput],
			async method(publicInput: GovActionIntentInput, privateInput: GovActionIntentAction1PrivateInput): Promise<{ publicOutput: GovActionIntentOutput }> {
				privateInput.proof.verify();	
				const ret = GovActionIntentOutput.empty();
				return { publicOutput: ret }
			}
		}
	}
}

)
// proof type

export class GovActionIntentProof extends ZkProgram.Proof(
  GovActionIntent
) {}

// flags 
const flags = FeatureFlags.allMaybe;
export class GovActionIntentDynamicProof extends DynamicProof<GovActionIntentInput, GovActionIntentOutput> {
  static publicInputType = GovActionIntentInput;
  static publicOutputType = GovActionIntentOutput;
  static maxProofsVerified = 0 as const;
  static featureFlags = flags;
}
