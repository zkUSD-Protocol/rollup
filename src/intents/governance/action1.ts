import { Field, Struct, ZkProgram } from "o1js";

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
