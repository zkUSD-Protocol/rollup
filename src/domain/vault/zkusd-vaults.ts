import { Field, Struct } from "o1js";
import { RollupRoots } from "../../core/map/merkle-root.js";
import { VaultMap } from "./vault-map.js";
import { VaultTypeData } from "./vault.js";

export class ZkUsdVaults extends Struct({
  vaultMapRoot: RollupRoots<VaultMap>(),
  ioMapRoot: RollupRoots<VaultMap>(),
  minaVaultTypeState: VaultTypeData,
  suiVaultTypeState: VaultTypeData,
}) {
    toFields(): Field [] {
        return [
            this.vaultMapRoot.intentRoot.root,
            this.vaultMapRoot.liveRoot.root,
            this.ioMapRoot.intentRoot.root,
            this.ioMapRoot.liveRoot.root,
            ...this.minaVaultTypeState.toFields(),
            ...this.suiVaultTypeState.toFields(),
        ];
    }
}