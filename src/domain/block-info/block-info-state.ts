import { Field, Struct, UInt64 } from "o1js";
import { MerkleRoot } from "../../core/map/merkle-root.js";

export class BlockDataMap {}

export class BlockInfoState extends Struct({
    previousBlockClosureTimestamp: UInt64,
    blockNumber: UInt64,
    intentSequence: UInt64,
    historicalStateMerkleRoot: MerkleRoot<BlockDataMap, 'live'>,
}){
    toFields() : Field[] {
        return [
            this.previousBlockClosureTimestamp.value,
            this.blockNumber.value,
            this.intentSequence.value,
            this.historicalStateMerkleRoot.root,
        ];
    }
}