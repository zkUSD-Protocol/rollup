import { FeatureFlags, DynamicProof } from "o1js";
import { BlockCloseIntentPreconditions, BlockCloseIntentPublicOutput } from "../../intents/block-close-intent.js";

const flags = FeatureFlags.allNone;
export class BlockCloseIntentDynamicProof extends DynamicProof<BlockCloseIntentPreconditions, BlockCloseIntentPublicOutput> {
  static publicInputType = BlockCloseIntentPreconditions;
  static publicOutputType = BlockCloseIntentPublicOutput;
  static maxProofsVerified = 0 as const;
  static featureFlags = flags;
}