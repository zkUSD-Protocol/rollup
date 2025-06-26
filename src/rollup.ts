import { Field, Struct, ZkProgram } from "o1js";
import { GovActionIntentPrivateInput } from "./intents/governance/wrapper.js";
import { ZkUsdState } from "./domain/zkusd/zkusd-state.js";

class ZkusdRollupState extends Struct({
	zkusdState: ZkUsdState,
}) {}


export const ZkusdRollup = ZkProgram({
  name: 'ZkusdRollup',
  publicInput: ZkusdRollupState,
  publicOutput: ZkusdRollupState,
  methods: {
	governanceUpdateIntent: {
		privateInputs: [GovActionIntentPrivateInput],
		async method(
			publicInput: ZkusdRollupState,
			privateInput: GovActionIntentPrivateInput
		): Promise<{ publicOutput: ZkusdRollupState }> {
			// Verify the intent proof
			privateInput.proof.verify();
			
			// output is input plus value from the proof
			const publicOutput = new ZkusdRollupState({
				zkusdState: publicInput.zkusdState
			});

			return { publicOutput };
		}
	}
		
	}	
});


