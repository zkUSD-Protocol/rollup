import { Bool, Field, Poseidon, Provable, Struct, UInt64 } from "o1js";
import { FizkRollupState } from "../domain/rollup-state";


export class BlockCommitment extends Struct({
    blockNumber: UInt64,
    rollupStateCommitment: Field,
    blockDataMerkleRoot: Field, // selected rollup fields made available via merkle map
}) {

    static buildRollupStateCommitment(state: FizkRollupState): Field {
        return Poseidon.hash(state.toFields());
    }

    static buildVerificationDataMerkleRoot(): Field {
        // todo
        return new Field(0);
    }

    static build(fizkRollupState: FizkRollupState): BlockCommitment {
        throw new Error("Not implemented.");
    }

    equals(other: BlockCommitment): Bool {
        return this.blockNumber.equals(other.blockNumber).and(
            this.rollupStateCommitment.equals(other.rollupStateCommitment).and(
                this.blockDataMerkleRoot.equals(other.blockDataMerkleRoot)
            )
        )
    }

    toFields(): Field[] {
        return [this.blockNumber.value, this.rollupStateCommitment, this.blockDataMerkleRoot];
    }
}