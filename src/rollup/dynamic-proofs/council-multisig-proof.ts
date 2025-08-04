import { FeatureFlags, DynamicProof } from "o1js";
import { GenericCouncilMultiSigPublicInput, GenericCouncilMultiSigOutput } from "../../intents/governance/council-multi-sig.js";

const flags = FeatureFlags.allNone;
export class GenericCouncilMultiSigDynamicProof extends DynamicProof<GenericCouncilMultiSigPublicInput, GenericCouncilMultiSigOutput> {
  static publicInputType = GenericCouncilMultiSigPublicInput;
  static publicOutputType = GenericCouncilMultiSigOutput;
  static maxProofsVerified = 0 as const;
  static featureFlags = flags;
}