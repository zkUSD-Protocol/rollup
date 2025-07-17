import { Struct } from "o1js"
import { Nullifiers, OutputNoteCommitment } from "../domain/zkusd/zkusd-note.js";
import { OutputNoteCommitments } from "../domain/zkusd/zkusd-note.js";

export class ZkusdMapUpdate extends Struct({
  nullifiers: Nullifiers,
  outputNoteCommitments: OutputNoteCommitments,
}) {}

export class ZkusdMapUpdateSingleOutput extends Struct({
  nullifiers: Nullifiers,
  outputNoteCommitment: OutputNoteCommitment,
}) {}
