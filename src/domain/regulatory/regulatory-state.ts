import { PublicKey, Struct } from "o1js";
import { MerkleRoot } from "../../core/map/merkle-root";

class BlackListMap {}

export class RegulatoryState extends Struct({
    auditPublicKey: PublicKey,
    blackListMerkleRoot: MerkleRoot<BlackListMap, 'live'>,
}){}
