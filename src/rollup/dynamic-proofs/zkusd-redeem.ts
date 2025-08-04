import { DynamicProof, FeatureFlags } from "o1js";
import { RedeemIntentOutput, RedeemIntentPreconditions } from "../../intents/redeem";


const flags = FeatureFlags.allNone;
export class RedeemIntentDynamicProof extends DynamicProof<RedeemIntentPreconditions, RedeemIntentOutput> {
  static publicInputType = RedeemIntentPreconditions;
  static publicOutputType = RedeemIntentOutput;
  static maxProofsVerified = 0 as const;
  static featureFlags = flags;
}
