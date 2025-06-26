import { Bool, Struct, UInt8 } from "o1js";


export class CollateralType extends Struct({
    value: UInt8
}) {

    static MinaCollateralType(): CollateralType {
        return new CollateralType({ value: UInt8.from(0) });
    }

    static SuiCollateralType(): CollateralType {
        return new CollateralType({ value: UInt8.from(1) });
    }

    equals(other: CollateralType): Bool {
        return this.value.value.equals(other.value.value)
    }
}
	
