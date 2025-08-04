import { DynamicProof, FeatureFlags, Field } from "o1js";
import { CreateVaultIntentOutput } from "../../intents/create-vault.js";

const flags = FeatureFlags.allNone;

export class CreateVaultIntentDynamicProof extends DynamicProof<Field, CreateVaultIntentOutput> {
  static publicInputType = Field;
  static publicOutputType = CreateVaultIntentOutput;
  static maxProofsVerified = 0 as const;

  static featureFlags = flags
}
  