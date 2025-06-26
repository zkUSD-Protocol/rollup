import { Field, Struct } from "o1js";
import { RollupRoots } from "../../core/map/merkle-root.js";
import { VaultMap } from "./vault-map.js";
import { VaultParameters } from "./vault.js";

export class ZkusdVaults extends Struct({
  vaultMapRoot: RollupRoots<VaultMap>(),
  ioMapRoot: RollupRoots<VaultMap>(),
  minaVaultParameters: VaultParameters,
  suiVaultParameters: VaultParameters,
}) {}