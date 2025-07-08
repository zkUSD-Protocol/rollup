import { Bool, Field, Struct, UInt32 } from "o1js";





export class BridgeCode extends Struct({
    value: UInt32
}){}

export class BridgeConfig extends Struct({
   code: BridgeCode,
   depositEnabled: Bool
}){

    static unpack(value: Field): BridgeConfig {
        const bits = value.toBits();
        // first 32 bits are the code
        const code = new BridgeCode({ value:UInt32.fromBits(bits.slice(0, 32)) });
        // next bit is the deposit enabled flag
        const depositEnabled = bits[32];
        return new BridgeConfig({
            code: code,
            depositEnabled: depositEnabled
        });
    }

    pack(): Field {
        const bits: Bool[] = [];
        bits.push(...this.code.value.toBits());
        bits.push(this.depositEnabled);
        return Field.fromBits(bits);
    }
}