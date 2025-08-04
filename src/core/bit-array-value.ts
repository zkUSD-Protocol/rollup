import { Field, Provable, Struct, UInt64, UInt8 } from "o1js";

const MAX_BIT_INDEX = new UInt8(240);

export class BitArrayValue extends Struct({
    value: Field,
}) {

    // NOTE: this is a witness, not a proved computation
    static fromBitIndexWitness(bitIndex: UInt8) {
        bitIndex.assertLessThan(MAX_BIT_INDEX);
        const proverValue = Provable.witness(Field, () => Field(1n << bitIndex.toBigInt()));
        return new BitArrayValue({
            value: proverValue,
        });
    }
    
}
    
