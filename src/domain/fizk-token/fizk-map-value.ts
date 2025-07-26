import { Struct, UInt32, UInt64 } from "o1js";
import { UInt50 } from "../../core/uint50";


export class FizkMapValue extends Struct({
    amountUnstaked: UInt50,
    amountStaked: UInt50,
    amountPendingUnlock: UInt50,
    globalGovRewardIndexSnapshot: UInt64,
    unlockTimestamp: UInt32
}) {

    static pack(v: FizkMapValue): Field {

    }

    static unpack(v: Field): FizkMapValue {

    }
}