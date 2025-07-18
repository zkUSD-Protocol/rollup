
import { Field, Struct, ZkProgram, DynamicProof } from "o1js";

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

export class GovernanceAction2IntentDynamicProof extends DynamicProof<GovernanceAction2IntentInput, GovernanceAction2IntentOutput> {
  static publicInputType = GovernanceAction2IntentInput;
  static publicOutputType = GovernanceAction2IntentOutput;
  static maxProofsVerified = 0 as const;
}
