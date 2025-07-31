import { Field, Struct, UInt32, UInt64 } from "o1js";
import { UInt50 } from "../../core/uint50";


export class FizkMapValue extends Struct({
    amountUnstaked: UInt50,
    amountStaked: UInt50,
    amountPendingUnlock: UInt50,
    globalGovRewardIndexSnapshot: UInt64,
    unlockTimestamp: UInt32
}) {

    toFields() {
        return [
            this.amountUnstaked.value,
            this.amountStaked.value,
            this.amountPendingUnlock.value,
            this.globalGovRewardIndexSnapshot.value,
            this.unlockTimestamp.value,
        ];
    }

    static empty() {
        return new FizkMapValue({
            amountUnstaked: UInt50.zero,
            amountStaked: UInt50.zero,
            amountPendingUnlock: UInt50.zero,
            globalGovRewardIndexSnapshot: UInt64.zero,
            unlockTimestamp: UInt32.zero,
        });
    }

    static pack(v: FizkMapValue): Field {
        return Field.fromBits([
            ...v.amountUnstaked.value.toBits().slice(0, 50),
            ...v.amountStaked.value.toBits().slice(0, 50),
            ...v.amountPendingUnlock.value.toBits().slice(0, 50),
            ...v.globalGovRewardIndexSnapshot.value.toBits().slice(0, 64),
            ...v.unlockTimestamp.value.toBits().slice(0, 32),
        ]);
    }

    static unpack(v: Field): FizkMapValue {
        const bits = v.toBits();
        return new FizkMapValue({
            amountUnstaked: UInt50.fromBits(bits.slice(0, 50)),
            amountStaked: UInt50.fromBits(bits.slice(50, 100)),
            amountPendingUnlock: UInt50.fromBits(bits.slice(100, 150)),
            globalGovRewardIndexSnapshot: UInt64.fromBits(bits.slice(150, 204)),
            unlockTimestamp: UInt32.fromBits(bits.slice(204, 236)),
        });
    }
}