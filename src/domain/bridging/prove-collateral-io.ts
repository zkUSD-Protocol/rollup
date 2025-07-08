import { Struct } from "o1js";
import { CollateralType } from "../vault/vault-collateral-type.js";
import { VaultAddress } from "../vault/vault-address.js";
import { Proof, ZkProgram } from "o1js";
import { MerkleRoot } from "../../core/map/merkle-root.js";
import { ObserverMap } from "../enclave/zskud-enclaves-state.js";
import { CollateralIOAccumulators } from "./collateral-io-accumulators.js";

export class CollateralIOProofInput extends Struct({
    
}) {}

export class CollateralIOProofOutput extends Struct({
    collateralType: CollateralType,
    vaultAddress: VaultAddress,
    ioAccumulators: CollateralIOAccumulators,
    oracleKeysMerkleRoot: MerkleRoot<ObserverMap>,
}) {}

// private input
export class DummyDepositProofPrivateInput extends Struct({
    collateralType: CollateralType,
    vaultAddress: VaultAddress,
    ioAccumulators: CollateralIOAccumulators,
    oracleKeysMerkleRoot: MerkleRoot<ObserverMap>,
}) {}


export const ProveCollateralIO = ZkProgram({
    name: 'ProveCollateralIO',
    publicInput: CollateralIOProofInput,
    publicOutput: CollateralIOProofOutput,
    methods: {
        dummy: {
            privateInputs: [DummyDepositProofPrivateInput],
            async method(
                publicInput: CollateralIOProofInput,
                privateInput: DummyDepositProofPrivateInput,
            ): Promise<{ publicOutput: CollateralIOProofOutput }> {
                return {
                    publicOutput: new CollateralIOProofOutput({
                        collateralType: privateInput.collateralType,
                        vaultAddress: privateInput.vaultAddress,
                        ioAccumulators: privateInput.ioAccumulators,
                        oracleKeysMerkleRoot: privateInput.oracleKeysMerkleRoot,
                    }),
                };
            },
        },
    },
});


export class CollateralIOProof extends Proof<CollateralIOProofInput, CollateralIOProofOutput> {
}        