import { FeatureFlags, DynamicProof } from "o1js";
import { GovActionIntentInput, GovActionIntentOutput } from "../../intents/governance/wrapper.js";

// flags 
const flags = FeatureFlags.allNone;
export class GovActionIntentDynamicProof extends DynamicProof<GovActionIntentInput, GovActionIntentOutput> {
  static publicInputType = GovActionIntentInput;
  static publicOutputType = GovActionIntentOutput;
  static maxProofsVerified = 0 as const;
  static featureFlags = flags;
}
