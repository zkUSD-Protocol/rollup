import { DynamicProof, FeatureFlags } from "o1js";
import { TransferIntentOutput, TransferIntentPreconditions } from "../../intents/transfer";


const flags = FeatureFlags.allNone;
export class TransferIntentDynamicProof extends DynamicProof<TransferIntentPreconditions, TransferIntentOutput> {
  static publicInputType = TransferIntentPreconditions;
  static publicOutputType = TransferIntentOutput;
  static maxProofsVerified = 0 as const;
  static featureFlags = flags;
}
