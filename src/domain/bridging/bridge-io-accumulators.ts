import { Field, Struct, UInt64 } from "o1js";

//  todo tests
export class BridgeIoAccumulators extends Struct({
    totalBurned: UInt64,
    totalMinted: UInt64,
}) {

    toFields(): Field[] {
        return [
            this.totalBurned.value,
            this.totalMinted.value,
        ];
    }

    pack(): Field {
        // bits 0-63: totalBurned
        // bits 64-127: totalMinted

        return Field.fromBits([
            ...this.totalBurned.value.toBits().slice(0, 64),
            ...this.totalMinted.value.toBits().slice(0, 64),
        ]);
    }

    static empty(): BridgeIoAccumulators {
        return new BridgeIoAccumulators({
            totalBurned: UInt64.zero,
            totalMinted: UInt64.zero,
        });
    }

    static unpack(field: Field): BridgeIoAccumulators {
        const totalBurned = UInt64.fromBits(field.toBits().slice(0, 64));
        const totalMinted = UInt64.fromBits(field.toBits().slice(64, 128));
        return new BridgeIoAccumulators({
            totalBurned,
            totalMinted,
        });
    }
}
    
    
