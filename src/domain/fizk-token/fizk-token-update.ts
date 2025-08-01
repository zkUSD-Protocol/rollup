import { Bool, Provable, Struct, } from "o1js";
import { FizkAddress } from "./fizk-address.js";
import { FizkMapValueUpdate } from "./fizk-map-value.js";
import { UInt50, } from "../../core/uint50.js";

export class FizkTransferUpdate extends Struct({
    from: FizkAddress,
    to: FizkAddress,
    amount: UInt50,
}) {}

export class FizkMintUpdate extends Struct({
    to: FizkAddress,
    amount: UInt50,
}) {}

export class FizkAddStakeUpdate extends Struct({
    to: FizkAddress,
    amount: UInt50,
}) {}

export class FizkModifyWithdrawalUpdate extends Struct({
    target: FizkAddress,
    amount: UInt50,
    isAdd: Bool,
}) {}

export class FizkTokenUpdate extends Struct({
    isNotDummy: Bool,
    address: FizkAddress,
    value: FizkMapValueUpdate
}) {}

const FizkTokenUpdateLength = 2;
export class FizkTokenUpdates extends Struct({
    updates: Provable.Array(FizkTokenUpdate, FizkTokenUpdateLength)
}) {
    static Length = FizkTokenUpdateLength;
    static empty() {
        return new FizkTokenUpdates({ updates: [FizkTokenUpdate.empty(), FizkTokenUpdate.empty()] });
    }
}
