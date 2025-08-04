import { DynamicProof, FeatureFlags } from "o1js";
import { DeficitCoverageLiquidationPreconditions, DeficitCoverageLiquidationPublicOutput } from "../../intents/deficit-coverage-liquidation.js";

const flags = FeatureFlags.allNone;
export class DeficitCoverageLiquidationDynamicProof extends DynamicProof<
  DeficitCoverageLiquidationPreconditions,
  DeficitCoverageLiquidationPublicOutput
> {
  static publicInputType = DeficitCoverageLiquidationPreconditions;
  static publicOutputType = DeficitCoverageLiquidationPublicOutput;
  static maxProofsVerified = 0 as const;
  static featureFlags = flags;
}