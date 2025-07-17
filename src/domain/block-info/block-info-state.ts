import { Field, Struct, UInt32, UInt64 } from "o1js";
import { MerkleRoot } from "../../core/map/merkle-root.js";
import { Timestamp } from "../../core/timestamp.js";
import { HistoricalBlockStateMap } from "./historical-block-state-map.js";
import { IntentInclusionMap } from "./intent-inclusion-map.js";

export class BlockInfoState extends Struct({
    previousBlockClosureTimestamp: Timestamp,
    blockNumber: UInt64,
    intentSequence: UInt64,
    historicalStateMerkleRoot: MerkleRoot<HistoricalBlockStateMap>,
    intentInclusionMerkleRoot: MerkleRoot<IntentInclusionMap>,
    includedIntents: UInt32,
}){
    toFields() : Field[] {
        return [
            ...this.previousBlockClosureTimestamp.toFields(),
            this.blockNumber.value,
            this.intentSequence.value,
            this.historicalStateMerkleRoot.root,
            this.intentInclusionMerkleRoot.root,
            this.includedIntents.value,
        ];
    }
}