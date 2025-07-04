import { Field, Struct, UInt64 } from "o1js";

//  todo tests
export class IOAccumulators extends Struct({
    totalDeposits: UInt64,
    totalWithdrawals: UInt64,
}) {

    pack(): Field {
        // bits 0-63: totalDeposits
        // bits 64-127: totalWithdrawals

        return Field.fromBits([
            ...this.totalDeposits.value.toBits().slice(0, 64),
            ...this.totalWithdrawals.value.toBits().slice(0, 64),
        ]);
    }

    static empty(): IOAccumulators {
        return new IOAccumulators({
            totalDeposits: UInt64.zero,
            totalWithdrawals: UInt64.zero,
        });
    }

    static unpack(field: Field): IOAccumulators {
        const totalDeposits = UInt64.fromBits(field.toBits().slice(0, 64));
        const totalWithdrawals = UInt64.fromBits(field.toBits().slice(64, 128));
        return new IOAccumulators({
            totalDeposits,
            totalWithdrawals,
        });
    }
}
    
    
