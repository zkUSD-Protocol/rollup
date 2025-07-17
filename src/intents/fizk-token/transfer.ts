import { Field, Struct, PublicKey, UInt64, Signature } from "o1js";
import { FizkAddress } from "../../domain/fizk-token/fizk-address.js";
import { FizkTransferUpdate } from "../../domain/fizk-token/fizk-token-update.js";
import { FizkTokenTransferPreconditions, FizkTokenTransferPublicOutput } from "./common.js";

const FizkTokenTransferIntentKey = new Field(25147812845881468449573503232060775496822886422785916277037335862564153254393n);

export class FizkTokenTransferPrivateInput extends Struct({
    ownerPublicKey: PublicKey,
    toAddress: FizkAddress,
    amount: UInt64,
    signature: Signature,
}) {}

export function transferFizkToken(publicInput: FizkTokenTransferPreconditions, privateInput: FizkTokenTransferPrivateInput): { publicOutput: FizkTokenTransferPublicOutput } {
    const { ownerPublicKey, toAddress, amount, signature } = privateInput;
    const { currentOperationNonce } = publicInput;

    const signedMessage: Field[] = [
        FizkTokenTransferIntentKey,
        currentOperationNonce.value,
        toAddress.address,
        amount.value,
    ];

    signature.verify(ownerPublicKey, signedMessage);
                
    // create update
    const update = new FizkTransferUpdate({
        from: FizkAddress.fromPublicKey(ownerPublicKey),
        to: toAddress,
        amount: amount,
    });

    return { publicOutput: { fizkTransferUpdate: update } };
}


// stake 
// global index
// status
// xp