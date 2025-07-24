import { Experimental, Field } from "o1js";

export class VkhMerkleMap extends Experimental.IndexedMerkleMap(11) {
    static stateUpdateProgramVkhKey: Field = new Field(1)
}