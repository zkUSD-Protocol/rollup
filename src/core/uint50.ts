import { Bool, Field, Struct, UInt64 } from "o1js";


export class UInt50 extends Struct({
    value: Field
}) {
    static maxint: UInt50 = new UInt50({value: Field(2n**50n-1n)});

    static zero = new UInt50({value: Field(0)});
    static fromBits(bits: Bool[]): UInt50 {
        return new UInt50({value: Field.fromBits(bits)})
    }

    static toBits(v: UInt50): Bool[] {
        return v.value.toBits().slice(0,50);
    }

    add(v2: UInt50): UInt50 {
        return new UInt50({value: this.value.add(v2.value)});
    }

    static verifySub(v1: UInt50, v2: UInt50): UInt50 {
        v1.value.assertGreaterThanOrEqual(v2.value);
        return new UInt50({value: v1.value.sub(v2.value)});
    }

    static toUInt64(v: UInt50): UInt64 {
        return UInt64.Unsafe.fromField(v.value);
    }

    toFields(): Field[] {
        return [this.value];
    }
}

export function uint50toUint64(v: UInt50): UInt64 {
    return UInt64.Unsafe.fromField(v.value);
}