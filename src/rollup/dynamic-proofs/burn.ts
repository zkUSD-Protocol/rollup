import { DynamicProof, FeatureFlags } from "o1js";
import { BurnIntentOutput, BurnIntentPreconditions } from "../../intents/burn.js";

const flags = FeatureFlags.allNone;
export class BurnIntentDynamicProof extends DynamicProof<BurnIntentPreconditions, BurnIntentOutput> {
  static publicInputType = BurnIntentPreconditions;
  static publicOutputType = BurnIntentOutput;
  static maxProofsVerified = 0 as const;
  static featureFlags = flags;
}