import { Field, PublicKey, Signature, Struct, UInt32, UInt64, ZkProgram } from "o1js";
import { FizkTransferUpdate } from "../../domain/fizk-token/fizk-token-update";
import { FizkAddress } from "../../domain/fizk-token/fizk-address";
// preconditions

export class FizkTokenTransferPreconditions extends Struct({
    currentOperationNonce: UInt32,
}) {}



export class FizkTokenTransferPublicOutput extends Struct({
    fizkTransferUpdate: FizkTransferUpdate,
}) {}