
// now we do wrap up, which is another intent level that combines the two actions

import { Field, Struct, ZkProgram } from "o1js";
import { GovernanceAction1IntentProof } from "./action1.js";
import { GovernanceAction2IntentProof } from "./action2.js";

export class GovActionIntentAction1PrivateInput extends Struct({
	proof: GovernanceAction1IntentProof,
}) {}

export class GovActionIntentAction2PrivateInput extends Struct({
	proof: GovernanceAction2IntentProof,
}) {}

// public inputs and output

export class GovActionIntentInput extends Struct({
	value: Field,
}) {}

export class GovActionIntentOutput extends Struct({
	value: Field,
}) {}

export const GovActionIntent = ZkProgram({
	name: 'GovernanceUpdateIntent',
	publicInput: GovActionIntentInput,
	publicOutput: GovActionIntentOutput,
	methods: {
		action1: {
			privateInputs: [GovActionIntentAction1PrivateInput],
			async method(publicInput: GovActionIntentInput, privateInput: GovActionIntentAction1PrivateInput): Promise<{ publicOutput: GovActionIntentOutput }> {
				// verify the proof
				privateInput.proof.verify();	
				return { publicOutput: new GovActionIntentOutput({ value: publicInput.value }) };
			}
		}
	}
}

)
// proof type

export class GovActionIntentProof extends ZkProgram.Proof(
  GovActionIntent
) {}

// the private input for the rollup level of the govactionintent

export class GovActionIntentPrivateInput extends Struct({
	proof: GovActionIntentProof,
}) {}

