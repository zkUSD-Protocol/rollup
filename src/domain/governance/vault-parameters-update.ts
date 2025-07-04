import { Struct, UInt64, UInt8 } from "o1js";

export class VaultParametersUpdate extends Struct({
  debtCeiling: UInt64,
  collateralRatio: UInt8,
  liquidationBonusRatio: UInt8,
  aprValueScaled: UInt64,
}) {}
