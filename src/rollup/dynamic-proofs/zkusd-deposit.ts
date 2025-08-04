import { DynamicProof, FeatureFlags } from "o1js";
import { DepositIntentOutput, DepositIntentPreconditions } from "../../intents/deposit";


const flags = FeatureFlags.allNone;
export class DepositIntentDynamicProof extends DynamicProof<DepositIntentPreconditions, DepositIntentOutput> {
  static publicInputType = DepositIntentPreconditions;
  static publicOutputType = DepositIntentOutput;
  static maxProofsVerified = 0 as const;
  static featureFlags = flags;
}
