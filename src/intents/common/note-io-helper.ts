// src/intents/common/note-io-helper.ts
import {
  Field,
  Provable,
  PublicKey,
  Signature,
  UInt64,
} from 'o1js';
import {
  InputNotes,
  MAX_INPUT_NOTE_COUNT,
  MAX_OUTPUT_NOTE_COUNT,
  Nullifiers,
  OutputNoteCommitments,
  OutputNotes,
} from '../../domain/zkusd/zkusd-note.js';
import { ZkUsdMap } from '../../domain/zkusd/zkusd-map.js';
import { ZkusdMapUpdate } from '../../state-updates/zkusd-map-update.js';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** A value we are certain will never appear as a real nullifier. */
const RANDOM_NULLIFIER_SENTINEL = Field.random();
const RANDOM_COMMITMENT_SENTINEL = Field.random();

/* ------------------------------------------------------------------ */
/*  Helper usable by Burn, Bridge, *and* Transfer                      */
/* ------------------------------------------------------------------ */

/**
 * Common circuit routine:
 *  • verifies the spender signature over `inputNotes`
 *  • marks input notes as spent (nullifiers)
 *  • mints up to `MAX_OUTPUT_NOTE_COUNT` new notes (commitments)
 *  • returns both value tallies and a ready-to-apply `ZkusdMapUpdate`
 */
export function processNotesAndCreateMapUpdate({
  zkusdMap,
  inputNotes,
  outputNotes,
  spendingSignature,
  spendingPublicKey,
}: {
  zkusdMap: ZkUsdMap;
  inputNotes: InputNotes;
  outputNotes: OutputNotes;
  spendingSignature: Signature;
  spendingPublicKey: PublicKey;
}): {
  valueIn: UInt64;
  valueOut: UInt64;
  zkusdMapUpdate: ZkusdMapUpdate;
} {
  /* ---------- verify spender signature ---------- */
  spendingSignature.verify(spendingPublicKey, inputNotes.toFields());

  /* ---------- INPUT notes → nullifiers ---------- */
  const nullifiers = Nullifiers.empty();
  let valueIn = UInt64.zero;

  for (let i = 0; i < MAX_INPUT_NOTE_COUNT; i++) {
    const note = inputNotes.notes[i];

    const commitmentObj = note.commitment();
    const nullifierObj  = note.nullifier();

    // inclusion check (skip dummy)
    zkusdMap.assertIncluded(
      Provable.if(note.isDummy.not(), commitmentObj.commitment, Field(0)),
    );

    // authorised spender
    note.assertAuthorizedSpender(spendingPublicKey);

    // nullifier must not be present
    zkusdMap.assertNotIncluded(
      Provable.if(
        note.isDummy.not(),
        nullifierObj.nullifier,
        RANDOM_NULLIFIER_SENTINEL,
      ),
    );

    // record nullifier (or dummy)
    nullifiers.nullifiers[i] = nullifierObj ;

    valueIn = valueIn.add(note.amount);
  }

  /* ---------- OUTPUT notes → commitments ---------- */
  const outCommitments = OutputNoteCommitments.empty();
  let valueOut = UInt64.zero;

  for (let i = 0; i < MAX_OUTPUT_NOTE_COUNT; i++) {
    const note = outputNotes.notes[i];
    const commitmentObj = note.commitment();

    // commitment must be fresh
    zkusdMap.assertNotIncluded(Provable.if(note.isDummy.not(), commitmentObj.commitment, RANDOM_COMMITMENT_SENTINEL));

    // record commitment (or dummy)
    outCommitments.commitments[i] = commitmentObj;

    valueOut = valueOut.add(note.amount);
  }

  /* ---------- build map update & return ---------- */
  const zkusdMapUpdate = new ZkusdMapUpdate({
    nullifiers,
    outputNoteCommitments: outCommitments,
  });

  return { valueIn, valueOut, zkusdMapUpdate };
}