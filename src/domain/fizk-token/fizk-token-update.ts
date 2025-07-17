import { Struct, UInt64 } from "o1js";
import { FizkAddress } from "./fizk-address";


export class FizkTransferUpdate extends Struct({
    from: FizkAddress,
    to: FizkAddress,
    amount: UInt64,
}) {}

export class FizkTokenUpdate extends Struct({
}) {}


