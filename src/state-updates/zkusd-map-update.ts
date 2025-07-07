import { Struct } from "o1js"
import { Nullifiers } from "../domain/zkusd/zkusd-note.js";
import { OutputNoteCommitments } from "../domain/zkusd/zkusd-note.js";

export class ZkusdMapUpdate extends Struct({
  nullifiers: Nullifiers,
  outputNoteCommitments: OutputNoteCommitments,
}) {}
