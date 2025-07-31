import { Field, Struct, UInt32, UInt64 } from "o1js";
import { UInt50 } from "../../core/uint50";
import { Timestamp34 } from "../../core/timestamp";

export class FizkMapValueUpdate extends Struct({
    amountUnstaked: UInt50,
    amountStaked: UInt50,
    amountPendingUnlock: UInt50,
}) {
    static empty() {
        return new FizkMapValueUpdate({
            amountUnstaked: UInt50.zero,
            amountStaked: UInt50.zero,
            amountPendingUnlock: UInt50.zero,
        });
    }

    static pack(v: FizkMapValueUpdate): Field {
        return Field.fromBits([
            ...v.amountUnstaked.value.toBits().slice(0, 50),
            ...v.amountStaked.value.toBits().slice(0, 50),
            ...v.amountPendingUnlock.value.toBits().slice(0, 50),
        ]);
    }

    static unpack(v: Field): FizkMapValueUpdate {
        const bits = v.toBits();
        return new FizkMapValueUpdate({
            amountUnstaked: UInt50.fromBits(bits.slice(0, 50)),
            amountStaked: UInt50.fromBits(bits.slice(50, 100)),
            amountPendingUnlock: UInt50.fromBits(bits.slice(100, 150)),
        });
    }
}

export class FizkMapValue extends Struct({
    amountUnstaked: UInt50,
    amountStaked: UInt50,
    amountPendingUnlock: UInt50,
    globalGovRewardIndexSnapshot: UInt64,
    unlockTimestamp: Timestamp34
}) {

    toFields() {
        return [
            this.amountUnstaked.value,
            this.amountStaked.value,
            this.amountPendingUnlock.value,
            this.globalGovRewardIndexSnapshot.value,
            this.unlockTimestamp.timestampSeconds.value,
        ];
    }

    static empty() {
        return new FizkMapValue({
            amountUnstaked: UInt50.zero,
            amountStaked: UInt50.zero,
            amountPendingUnlock: UInt50.zero,
            globalGovRewardIndexSnapshot: UInt64.zero,
            unlockTimestamp: Timestamp34.fromSeconds(UInt32.zero),
        });
    }

    static fromUpdate(update: FizkMapValueUpdate, globalGovRewardIndexSnapshot: UInt64, unlockTimestamp: Timestamp34): FizkMapValue {
        return new FizkMapValue({
            amountUnstaked: update.amountUnstaked,
            amountStaked: update.amountStaked,
            amountPendingUnlock: update.amountPendingUnlock,
            globalGovRewardIndexSnapshot, 
            unlockTimestamp 
        });
    }

    static toUpdate(v: FizkMapValue): FizkMapValueUpdate {
        return new FizkMapValueUpdate({
            amountUnstaked: v.amountUnstaked,
            amountStaked: v.amountStaked,
            amountPendingUnlock: v.amountPendingUnlock,
        });
    }

    static pack(v: FizkMapValue): Field {
        return Field.fromBits([
            ...v.amountUnstaked.value.toBits().slice(0, 50),
            ...v.amountStaked.value.toBits().slice(0, 50),
            ...v.amountPendingUnlock.value.toBits().slice(0, 50),
            ...v.globalGovRewardIndexSnapshot.value.toBits().slice(0, 64),
            ...v.unlockTimestamp.timestampSeconds.toBits()
        ]);
    }

    static unpack(v: Field): FizkMapValue {
        const bits = v.toBits();
        return new FizkMapValue({
            amountUnstaked: UInt50.fromBits(bits.slice(0, 50)),
            amountStaked: UInt50.fromBits(bits.slice(50, 100)),
            amountPendingUnlock: UInt50.fromBits(bits.slice(100, 150)),
            globalGovRewardIndexSnapshot: UInt64.fromBits(bits.slice(150, 204)),
            unlockTimestamp: Timestamp34.fromBits(bits.slice(204, 236))
        });
    }
}