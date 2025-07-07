import {
  Struct,
  UInt64,
  Field,
  UInt8,
  Bool,
  PublicKey,
} from 'o1js';
import { VaultState } from './vault-state.js';
import { CollateralType } from './vault-collateral-type.js';

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
  debtCeiling: UInt64,
  collateralRatio: UInt8,
  liquidationBonusRatio: UInt8,
  aprValueScaled: UInt64,
}) {

  toFields(): Field[] {
    return [
      this.debtCeiling.value,
      this.collateralRatio.value,
      this.liquidationBonusRatio.value,
      this.aprValueScaled.value,
    ]
  }

  equals(other: VaultParameters): Bool {
    return this.debtCeiling.value.equals(other.debtCeiling.value)
      .and(this.collateralRatio.value.equals(other.collateralRatio.value))
      .and(this.liquidationBonusRatio.value.equals(other.liquidationBonusRatio.value))
      .and(this.aprValueScaled.value.equals(other.aprValueScaled.value));
  }
}


export class VaultTypeData extends Struct({
  parameters: VaultParameters,
  priceNanoUsd: UInt64,
  globalAccumulativeInterestRateScaled: UInt64,
  lastUpdateTimestampSec: UInt64,
  totalNda: UInt64,
}) {

  toFields(): Field[] {
    return [
      ...this.parameters.toFields(),
      this.priceNanoUsd.value,
      ...this.globalAccumulativeInterestRateScaled.toFields(),
      this.lastUpdateTimestampSec.value,
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

    /**
     * @notice  This method is used to initialize a new vault
     * @returns The initialized vault
     */
    static new(type: CollateralType): Vault_ {
      return new Vault_(new VaultState({
        collateralAmount: UInt64.zero,
        normalizedDebtAmount: UInt64.zero,
        collateralType: type,
      }));
    }

    static fromState(state: VaultState): Vault_ {
      return new Vault_(state);
    }
    
    pack(): Field {
      return super.pack();
    }

    static unpack(field: Field): Vault_ {
      return new Vault_(VaultState.unpack(field));
    }

    /**
     * @notice  This method is used to deposit collateral into the vault
     * @param   amount - The amount of collateral to deposit
     */
    depositCollateral(amount: UInt64): void {
      // Ensure deposit amount is positive
      amount.assertGreaterThan(UInt64.zero, VaultErrors.AMOUNT_ZERO);
      // Create new vault state with increased collateral
      this.collateralAmount = this.collateralAmount.add(amount);
    }

    
    /**
     * @notice  This method is used to redeem collateral from the vault
     * @param   amount - The amount of collateral to redeem
     * @param   minaPrice - The current price of MINA in nanoUSD
     * @returns The new vault state after the redemption
     */
    redeemCollateral(
      amount: UInt64,
      minaPrice: UInt64
    ): void {
      // Ensure redemption amount is positive
      amount.assertGreaterThan(UInt64.zero, VaultErrors.AMOUNT_ZERO);
      
      // TODO: not implemented
      console.warn('TODO: not implemented')

      this.collateralAmount = this.collateralAmount.sub(amount);
    }

    /**
     * @notice  This method is used to burn zkUSD against the vault
     * @param   amount - The amount of zkUSD to burn
     * @returns The new vault state after the burn
     */
    repayDebt(amount: UInt64): VaultState {
      // Ensure repayment amount is positive
      amount.assertGreaterThan(UInt64.zero, VaultErrors.AMOUNT_ZERO);

      // Verify sufficient debt exists to burn
      this.normalizedDebtAmount.assertGreaterThanOrEqual(
        amount,
        VaultErrors.AMOUNT_EXCEEDS_DEBT
      );

      // Create new vault state with reduced debt
      const newVaultState = new VaultState({
        collateralAmount: this.collateralAmount,
        normalizedDebtAmount: this.normalizedDebtAmount.sub(amount),
        collateralType: this.collateralType,
      });

      return newVaultState;
    }


    toFields(): Field[] {
      return [
        this.collateralAmount.value,
        this.normalizedDebtAmount.value,
        this.collateralType.value.value,
      ];
    }

  }
  
  
  return VaultClass;
}