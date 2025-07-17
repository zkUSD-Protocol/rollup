import { PublicKey, Field, Poseidon, Struct } from "o1js";

const FizkAddressSalt = new Field(16124250649831170961587217695896239891555718385315164457861539279385156598307n);

export class FizkAddress extends Struct({
    address: Field
}) {

    static fromPublicKey(publicKey: PublicKey): FizkAddress {
        const hash = Poseidon.hash([FizkAddressSalt, publicKey.x]);// is x unique?
        return new FizkAddress({
            address: hash
        });
    }

}
