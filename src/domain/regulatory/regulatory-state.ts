import { Field, PublicKey, Struct } from "o1js";
import { MerkleRoot } from "../../core/map/merkle-root.js";

class BlackListMap {}

export class RegulatoryState extends Struct({
    auditPublicKey: PublicKey,
    blackListMerkleRoot: MerkleRoot<BlackListMap>,
}){
    toFields(): Field[] {
        return [
            ...this.auditPublicKey.toFields(),
            this.blackListMerkleRoot.root,
        ];
    }
}
