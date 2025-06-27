import {
  Struct,
  UInt64,
  Field,
  Bool,
  PublicKey,
  UInt8,
} from 'o1js';
import { VaultState } from './vault-state.js';

// Errors
export const VaultErrors = {
  VAULT_EXISTS: 'Vault already exists',
  AMOUNT_ZERO: 'Transaction amount must be greater than zero',
  HEALTH_FACTOR_TOO_LOW:
    'Vault would become undercollateralized (health factor < 100). Add more collateral or reduce debt first',
  HEALTH_FACTOR_TOO_HIGH:
    'Cannot liquidate: Vault is sufficiently collateralized (health factor > 100)',
  AMOUNT_EXCEEDS_DEBT:
    'Cannot repay more than the current outstanding debt amount',
  INVALID_ORACLE_SIG: 'Invalid price feed signature from oracle',
  ORACLE_EXPIRED:
    'Price feed data has expired - please use current oracle data',
  INSUFFICIENT_BALANCE: 'Requested amount exceeds the vaults zkUSD balance',
  INSUFFICIENT_COLLATERAL:
    'Requested amount exceeds the deposited collateral in the vault ',
};


export class VaultParameters extends Struct({
  collateralAmount: UInt64,
  normalizedDebtAmount: UInt64,
  owner: PublicKey,
  debtCeiling: UInt64,
  collateralRatio: UInt8,
  liquidationBonusRatio: UInt8,
  priceNanoUsd: UInt64,
  globalAccumulativeInterestRate: UInt64,
  lastUpdateTimestamp: UInt64,
  aprValue: UInt64,
  totalNda: UInt64,
}) {

  toFields(): Field[] {
    return [
      this.collateralAmount.value,
      this.normalizedDebtAmount.value,
      ...this.owner.toFields(),
      this.debtCeiling.value,
      this.collateralRatio.value,
      this.liquidationBonusRatio.value,
      this.priceNanoUsd.value,
      this.globalAccumulativeInterestRate.value,
      this.lastUpdateTimestamp.value,
      this.aprValue.value,
      this.totalNda.value,
    ];
  }
}


/**
 * @title   Vault Struct
 * @notice  Core vault implementation that manages user collateral and debt positions
 * @dev     Combines the account update mechanism with vault state management
 *          All vault operations (deposit, withdraw, mint, burn) are performed through this struct
 * @param   accountUpdate - The account update object used for on-chain state modifications
 * @param   state - The current state of the vault containing collateral and debt information
 */
export function Vault(params: VaultParameters) {
  const VaultClass = class Vault_ extends Struct(VaultState) {
    static COLLATERAL_RATIO: Field = params.collateralRatio.value; // The collateral ratio is the minimum ratio of collateral to debt that the vault must maintain
    static COLLATERAL_RATIO_PRECISION = Field.from(100); // The precision of the collateral ratio
    static PROTOCOL_FEE_PRECISION = UInt64.from(100); // The precision of the protocol fee
    static UNIT_PRECISION = Field.from(1e9); // The precision of the unit - Mina has 9 decimal places
    static MIN_HEALTH_FACTOR = UInt64.from(100); // The minimum health factor that the vault must maintain when adjusted
    static LIQUIDATION_BONUS_RATIO = params.liquidationBonusRatio.value; // The bonus ratio for liquidators when liquidating a vault

    static new(vaultState: VaultState) {
      return new Vault_(vaultState);
    }
    
    //todo
    pack(): Field {
      // const bits = [
      //   ...this.type.value.toBits(8),
      //   ...this.collateralAmount.value.toBits(64),
      //   ...this.debtAmount.value.toBits(64),
      // ];
      // return Field.fromBits(bits);
      return new Field(0);
    }
  }
  
  return VaultClass;
}