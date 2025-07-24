import { Struct, ZkProgram, DynamicProof, FeatureFlags } from "o1js";

export class DeficitCoverageLiquidationPreconditions extends Struct({}) {}

export class DeficitCoverageLiquidationPrivateInput extends Struct({}) {}

export class DeficitCoverageLiquidationPublicOutput extends Struct({}) {}

export const DeficitCoverageLiquidation = ZkProgram({
  name: "DeficitCoverageLiquidation",
  publicInput: DeficitCoverageLiquidationPreconditions,
  publicOutput: DeficitCoverageLiquidationPublicOutput,
  methods: {
    dummy: {
      privateInputs: [DeficitCoverageLiquidationPrivateInput],
      async method(
        publicInput: DeficitCoverageLiquidationPreconditions,
        privateInput: DeficitCoverageLiquidationPrivateInput,
      ): Promise<{ publicOutput: DeficitCoverageLiquidationPublicOutput }> {
        return { publicOutput: publicInput };
      },
    },
  },
});

export class DeficitCoverageLiquidationProof extends ZkProgram.Proof(
  DeficitCoverageLiquidation,
) {}

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
