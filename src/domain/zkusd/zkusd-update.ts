import { Struct } from "o1js";
import { Nullifiers, OutputNoteCommitments } from "./zkusd-note.js";

export class ZkUsdUpdate extends Struct({
    outputNoteCommitments: OutputNoteCommitments,
    nullifiers: Nullifiers,
}) {}


