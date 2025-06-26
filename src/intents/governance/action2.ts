
import { Field, Struct, ZkProgram } from "o1js";

export class GovernanceAction2IntentInput extends Struct({
	value: Field,
}) {}

export class GovernanceAction2IntentOutput extends Struct({
	value: Field,
}) {}

export const GovernanceAction2Intent = ZkProgram({
	name: 'GovernanceAction2Intent',
	publicInput: GovernanceAction2IntentInput,
	publicOutput: GovernanceAction2IntentOutput,
	methods: {
		dummy: {
			privateInputs: [],
			async method(publicInput: GovernanceAction2IntentInput): Promise<{ publicOutput: GovernanceAction2IntentOutput }> {
				return { publicOutput: new GovernanceAction2IntentOutput({ value: publicInput.value }) };
			}
		}
	}
})
	
export class GovernanceAction2IntentProof extends ZkProgram.Proof(
  GovernanceAction2Intent
) {}
