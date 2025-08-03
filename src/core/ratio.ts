import { Field, Struct, UInt32, UInt64 } from "o1js";
import { UInt50 } from "./uint50.js";


export class Ratio32 extends Struct({
    num: UInt32,
}) {
    static denominator = Field.from(BigInt(1e10));

    static mul64(ratio: Ratio32, amount: UInt64): UInt64 {
        const v = amount.value.mul(ratio.num.value);
        const v2 = v.div(Ratio32.denominator);
        return UInt64.Unsafe.fromField(v2);
    }

    static mul50(ratio: Ratio32, amount: UInt50): UInt50 {
        const v = amount.value.mul(ratio.num.value);
        const v2 = v.div(Ratio32.denominator);
        return new UInt50({ value: v2 });
    }
}