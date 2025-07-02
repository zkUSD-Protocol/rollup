import { Field, Struct } from "o1js";
import { Pcrs } from "./pcrs.js";
import { MerkleRoot } from "../../core/map/merkle-root.js";

export class ObserverMap {}
export class ValidatorMap {}
export class OrchestratorMap {}
export class IntentSponsorMap {}

export class ZkusdEnclavesState extends Struct({
    observerPcrsHash: Field,
    validatorPcrsHash: Field,
    orchestratorPcrsHash: Field,
    intentSponsorPcrsHash: Field,
    observerKeyMerkleRoot: MerkleRoot<ObserverMap, 'live'>,
    validatorKeyMerkleRoot: MerkleRoot<ValidatorMap, 'live'>,
    orchestratorKeyMerkleRoot: MerkleRoot<OrchestratorMap, 'live'>,
    intentSponsorKeyMerkleRoot: MerkleRoot<IntentSponsorMap, 'live'>,
}){
    toFields(): Field[] {
        return [
            this.observerPcrsHash,
            this.validatorPcrsHash,
            this.orchestratorPcrsHash,
            this.intentSponsorPcrsHash,
            this.observerKeyMerkleRoot.root,
            this.validatorKeyMerkleRoot.root,
            this.orchestratorKeyMerkleRoot.root,
            this.intentSponsorKeyMerkleRoot.root,
        ];
    }
}
