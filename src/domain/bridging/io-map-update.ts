import { Struct, UInt64 } from "o1js";
import { VaultAddress } from "../vault/vault-address";

export class IoMapUpdate extends Struct({
    deposits: UInt64,
    withdrawals: UInt64,
    vaultAddress: VaultAddress,
}) {
    static deposit(vaultAddress: VaultAddress, amount: UInt64): IoMapUpdate {
        return new IoMapUpdate({
            deposits: amount,
            withdrawals: UInt64.zero,
            vaultAddress: vaultAddress,
        });
    }
    
    static withdraw(vaultAddress: VaultAddress, amount: UInt64): IoMapUpdate {
        return new IoMapUpdate({
            deposits: UInt64.zero,
            withdrawals: amount,
            vaultAddress: vaultAddress,
        });
    }
} 
    

export class BridgeIntentUpdate extends Struct({
  vaultAddress: VaultAddress,
  amount: UInt64,
}) {}

export class BridgeBackIntentUpdate extends Struct({
  vaultAddress: VaultAddress,
  amount: UInt64,
}) {}
