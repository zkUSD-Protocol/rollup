import { DynamicProof, FeatureFlags } from "o1js";
import { FizkTransferPreconditions } from "../../intents/fizk-token/transfer.js";
import { FizkTransferPublicOutput } from "../../intents/fizk-token/transfer.js";

const flags = FeatureFlags.allNone;

export class FizkTokenIntentWrapperDynamicProof extends DynamicProof<FizkTransferPreconditions, FizkTransferPublicOutput> {
  static publicInputType = FizkTransferPreconditions;
  static publicOutputType = FizkTransferPublicOutput;
  static maxProofsVerified = 0 as const;
  static featureFlags = flags;
}
