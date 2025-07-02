import { Provable, Struct, UInt8 } from "o1js";
import { VaultAddress } from "./vault-address.js";
import { ZkUsdVaults } from "./zkusd-vaults.js";
import { Vault, VaultParameters } from "./vault.js";
import { VaultMap } from "./vault-map.js";
import { CollateralType } from "./vault-collateral-type.js";
import { VaultState } from "./vault-state.js";


export class VaultUpdate extends Struct({
  collateralType: CollateralType,
  vaultAddress: VaultAddress,
  vaultState: VaultState,
}) {}


