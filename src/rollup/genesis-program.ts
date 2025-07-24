import { Struct, ZkProgram } from "o1js";
import { BlockCommitment } from "./block-commitment";
import { FizkRollupState } from "../domain/rollup-state";


export class GenesisParameters extends Struct({
    initialState: FizkRollupState
}){}

export const GenesisProgram = ZkProgram({
    name: "GenesisProgram1",
    publicInput: GenesisParameters,
    methods: {
        proveGenesisState: {
            privateInputs: [],
            async method(
                publicInput: GenesisParameters
            ) {
                // TODO, basically verify that govenment is operative.
                // and that it signs the state
            }
        },
    }
});

export class GenesisProgramProof extends GenesisProgram.Proof {}