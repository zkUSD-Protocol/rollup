import { Field, Poseidon, PublicKey, Struct } from "o1js";
import { BridgeCode } from "./bridge.js";


export class BridgedAddress extends Struct({
    key: Field,
}){

    static fromPublicKey(publicKey: PublicKey, bridgeCode: BridgeCode): BridgedAddress {
        return new BridgedAddress({
            key: Poseidon.hash([
                ...publicKey.toFields(),
                bridgeCode.value.value,
            ]),
        });
    } 
}