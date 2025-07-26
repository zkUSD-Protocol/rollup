import { Bool, Field, Struct } from "o1js";


export class UInt50 extends Struct({
    value: Field
}) {
    static fromBits(bits: Bool[]): UInt50 {
        return new UInt50({value: Field.fromBits(bits)})
    }

    static toBits(v: UInt50): Bool[] {
        return v.value.toBits().slice(0,50);
    }
}