import { Bool, Provable, Struct, UInt64 } from "o1js";
import { FizkAddress } from "./fizk-address.js";
import { FizkMapValue } from "./fizk-map-value.js";
import { PublicKey } from "o1js";
import { UInt50 } from "../../core/uint50.js";

export class FizkTransferUpdate extends Struct({
    from: FizkAddress,
    to: FizkAddress,
    amount: UInt64,
}) {}

export class FizkMintUpdate extends Struct({
    to: FizkAddress,
    amount: UInt64,
}) {}

export class FizkAddStakeUpdate extends Struct({
    to: FizkAddress,
    amount: UInt50,
}) {}

export class FizkTokenUpdate extends Struct({
    isNotDummy: Bool,
    address: FizkAddress,
    value: FizkMapValue
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
