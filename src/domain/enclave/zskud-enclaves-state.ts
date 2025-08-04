import { Field, Struct } from "o1js";
import { MerkleRoot } from "../../core/map/merkle-root.js";
import { ObserverMap } from "./observer-map.js";
import { IndexedMerkleMap } from "o1js/dist/node/lib/provable/merkle-tree-indexed.js";

export class ValidatorMap extends IndexedMerkleMap(3) {} // 3 keys max (1,2,3)
export class OrchestratorMap {}
export class IntentSponsorMap extends IndexedMerkleMap(3) {}

export class ZkusdEnclavesState extends Struct({
    observerPcrsHash: Field,
    validatorPcrsHash: Field,
    orchestratorPcrsHash: Field,
    intentSponsorPcrsHash: Field,
    observerKeysMerkleRoot: MerkleRoot<ObserverMap>,
    validatorKeysMerkleRoot: MerkleRoot<ValidatorMap>,
    orchestratorKeysMerkleRoot: MerkleRoot<OrchestratorMap>,
    intentSponsorKeysMerkleRoot: MerkleRoot<IntentSponsorMap>,
}){
    toFields(): Field[] {
        return [
            this.observerPcrsHash,
            this.validatorPcrsHash,
            this.orchestratorPcrsHash,
            this.intentSponsorPcrsHash,
            this.observerKeysMerkleRoot.root,
            this.validatorKeysMerkleRoot.root,
            this.orchestratorKeysMerkleRoot.root,
            this.intentSponsorKeysMerkleRoot.root,
        ];
    }
}
