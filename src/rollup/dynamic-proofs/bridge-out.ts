import { FeatureFlags, DynamicProof } from "o1js";
import { BridgeOutIntentPreconditions, BridgeOutIntentOutput } from "../../intents/bridge-out.js";

const flags = FeatureFlags.allNone;
export class BridgeOutIntentDynamicProof extends DynamicProof<BridgeOutIntentPreconditions, BridgeOutIntentOutput> {
  static publicInputType = BridgeOutIntentPreconditions;
  static publicOutputType = BridgeOutIntentOutput;
  static maxProofsVerified = 0 as const;
  static featureFlags = flags;
}