import { Field, Struct } from "o1js";
import { VaultMap } from "./vault-map.js";
import { VaultTypeData } from "./vault.js";
import { MerkleRoot } from "../../core/map/merkle-root.js";
import { CollateralIoMap } from "../bridging/collateral-io-map.js";

export class ZkUsdVaults extends Struct({
  vaultMapRoot: MerkleRoot<VaultMap>,
  ioMapRoot: MerkleRoot<CollateralIoMap>,
  minaVaultTypeState: VaultTypeData,
  suiVaultTypeState: VaultTypeData,
}) {
    toFields(): Field [] {
        return [
            this.vaultMapRoot.root,
            this.ioMapRoot.root,
            ...this.minaVaultTypeState.toFields(),
            ...this.suiVaultTypeState.toFields(),
        ];
    }
}