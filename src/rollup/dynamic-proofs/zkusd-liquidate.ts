import { DynamicProof, FeatureFlags } from "o1js";
import { LiquidateIntentOutput, LiquidateIntentPreconditions } from "../../intents/liquidate";


const flags = FeatureFlags.allNone;
export class LiquidateIntentDynamicProof extends DynamicProof<LiquidateIntentPreconditions, LiquidateIntentOutput> {
  static publicInputType = LiquidateIntentPreconditions;
  static publicOutputType = LiquidateIntentOutput;
  static maxProofsVerified = 0 as const;
  static featureFlags = flags;
}
