import { Struct, ZkProgram } from "o1js";

export class DeficitCoverageLiquidationPreconditions extends Struct({
    
}) {}

export class DeficitCoverageLiquidationPrivateInput extends Struct({
    
}) {}

export class DeficitCoverageLiquidationPublicOutput extends Struct({
    
}) {}

export const DeficitCoverageLiquidation = ZkProgram({
    name: 'DeficitCoverageLiquidation',
    publicInput: DeficitCoverageLiquidationPreconditions,
    publicOutput: DeficitCoverageLiquidationPublicOutput,
    methods: {
        dummy: {
            privateInputs: [DeficitCoverageLiquidationPrivateInput],
            async method(publicInput: DeficitCoverageLiquidationPreconditions, privateInput: DeficitCoverageLiquidationPrivateInput): Promise<{ publicOutput: DeficitCoverageLiquidationPublicOutput }> {
                return { publicOutput: publicInput };
            }
        }
    }
})

export class DeficitCoverageLiquidationProof extends ZkProgram.Proof(DeficitCoverageLiquidation) {}
