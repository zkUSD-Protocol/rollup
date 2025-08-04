import { FeatureFlags, DynamicProof } from "o1js";
import { BridgeInIntentPreconditions, BridgeInIntentOutput } from "../../intents/bridge-in.js";

const flags = FeatureFlags.allNone;
export class BridgeInIntentDynamicProof extends DynamicProof<BridgeInIntentPreconditions, BridgeInIntentOutput> {
  static publicInputType = BridgeInIntentPreconditions;
  static publicOutputType = BridgeInIntentOutput;
  static maxProofsVerified = 0 as const;
  static featureFlags = flags;
}