import { DynamicProof, FeatureFlags } from "o1js";
import { MintIntentOutput, MintIntentPreconditions } from "../../intents/mint";


const flags = FeatureFlags.allNone;
export class MintIntentDynamicProof extends DynamicProof<MintIntentPreconditions, MintIntentOutput> {
  static publicInputType = MintIntentPreconditions;
  static publicOutputType = MintIntentOutput;
  static maxProofsVerified = 0 as const;
  static featureFlags = flags;
}
