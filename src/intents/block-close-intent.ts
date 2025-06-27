import { Field, Signature, Struct, UInt64, ZkProgram } from "o1js";
import { MerkleRoot } from "../core/map/merkle-root.js";
import { ObserverMap } from "../domain/enclave/zskud-enclaves-state.js";

export class BlockCloseIntentPublicInput extends Struct({
    
}) {}

export class BlockCloseIntentPublicOutput extends Struct({
    
}) {}


export const BlockCloseIntent = ZkProgram({
    name: 'BlockCloseIntent',
    publicInput: BlockCloseIntentPublicInput,
    publicOutput: BlockCloseIntentPublicOutput,
    methods: {
        dummy: {
            privateInputs: [],
            async method(publicInput: BlockCloseIntentPublicInput): Promise<{ publicOutput: BlockCloseIntentPublicOutput }> {
                return { publicOutput: publicInput };
            }
        }
    }
})

export class BlockCloseIntentProof extends ZkProgram.Proof(BlockCloseIntent) {}


export class ObserverPriceProofPublicInput extends Struct({
    observersMerkleRoot: MerkleRoot<ObserverMap, 'live'>,
}) {}
    
export class ObserverPriceProofPublicOutput extends Struct({
    suiPriceNanoUsd: UInt64,
    minaPriceNanoUsd: UInt64,
    timestamp: UInt64,
}) {}

export const ObserverPriceProgram = ZkProgram({
    name: 'ObserverPriceProof',
    publicInput: ObserverPriceProofPublicInput,
    publicOutput: ObserverPriceProofPublicOutput,
    methods: {
    }
})

export class ObserverPriceProof extends ZkProgram.Proof(ObserverPriceProgram) {}


export class BlockCloseIntentPrivateInput extends Struct({
    // validatorSignature: Signature,
    observerPriceProof: ObserverPriceProof,
}) {}