import {
  Field,
  Poseidon,
  PublicKey,
  Signature,
  Struct,
  UInt64,
  ZkProgram,
  DynamicProof,
} from 'o1js';

// governance actions intent
export class GovernanceAction1IntentInput extends Struct({
	value: Field,
}) {}

export class GovernanceAction1IntentOutput extends Struct({
	value: Field,
}) {}


export const GovernanceAction1Intent = ZkProgram({
	name: 'GovernanceAction1Intent',
	publicInput: GovernanceAction1IntentInput,
	publicOutput: GovernanceAction1IntentOutput,
	methods: {
		dummy: {
			privateInputs: [],
			async method(publicInput: GovernanceAction1IntentInput): Promise<{ publicOutput: GovernanceAction1IntentOutput }> {
				return { publicOutput: new GovernanceAction1IntentOutput({ value: publicInput.value }) };
			}
		}
	}
})

export class GovernanceAction1IntentProof extends ZkProgram.Proof(
  GovernanceAction1Intent
) {}

export class GovernanceAction1IntentDynamicProof extends DynamicProof<GovernanceAction1IntentInput, GovernanceAction1IntentOutput> {
  static publicInputType = GovernanceAction1IntentInput;
  static publicOutputType = GovernanceAction1IntentOutput;
  static maxProofsVerified = 0 as const;
}
