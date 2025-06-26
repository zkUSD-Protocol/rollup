import { Provable, Struct, UInt8 } from "o1js";
import { VaultAddress } from "./vault-address.js";
import { ZkusdVaults } from "./zkusd-vaults.js";
import { Vault, VaultParameters } from "./vault.js";
import { VaultMap } from "./vault-map.js";
import { CollateralType } from "./vault-collateral-type.js";


export class VaultUpdate extends Struct({
  collateralType: CollateralType,
  vaultAddress: VaultAddress,
  vaultState: VaultParameters,
}) {}


