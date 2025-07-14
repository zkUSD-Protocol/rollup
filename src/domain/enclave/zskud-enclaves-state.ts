import { Field, Struct } from "o1js";
import { MerkleRoot } from "../../core/map/merkle-root.js";
import { ObserverMap } from "./observer-map.js";

export class ValidatorMap {}
export class OrchestratorMap {}
export class IntentSponsorMap {}

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
