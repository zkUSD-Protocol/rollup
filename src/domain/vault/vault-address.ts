import { Field, Poseidon, PublicKey, Struct } from "o1js";
import { CollateralType } from "./vault-collateral-type.js";

export class VaultAddress extends Struct({
  key: Field,
}) {
    static fromPublicKey(publicKey: PublicKey, collateralType: CollateralType): VaultAddress {
        return mkVaultKey(publicKey, collateralType);
    }

    static minaVaultKey(publicKey: PublicKey): VaultAddress {
        return mkVaultKey(publicKey, CollateralType.MINA);
    }
}


// annotate return type
const mkVaultKey = (ownerPublicKey: PublicKey, collateralType: CollateralType): VaultAddress =>
    new VaultAddress({
          key: Poseidon.hash([
            ...ownerPublicKey.toFields(),
            collateralType.value.value,
          ])
        });