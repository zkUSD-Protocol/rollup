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
  Note,
  Nullifiers,
  OutputNoteCommitment,
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
 * Processes *input* notes:
 *  • verifies the spender signature over `inputNotes`
 *  • checks inclusion & authorisation
 *  • creates the array of nullifiers
 *  • tallies the total value in
 */
export function processInputNotes({
  zkusdMap,
  inputNotes,
  spendingSignature,
  spendingPublicKey,
}: {
  zkusdMap: ZkUsdMap;
  inputNotes: InputNotes;
  spendingSignature: Signature;
  spendingPublicKey: PublicKey;
}): {
  valueIn: UInt64;
  nullifiers: Nullifiers;
} {
  /* ---------- verify spender signature ---------- */
  // todo move to top level to include intent key
  spendingSignature.verify(spendingPublicKey, inputNotes.toFields());

  const nullifiers = Nullifiers.empty();
  let valueIn = UInt64.zero;

  for (let i = 0; i < MAX_INPUT_NOTE_COUNT; i++) {
    const note = inputNotes.notes[i];

    const commitmentObj = Note.commitment(note);
    const nullifierObj = Note.nullifier(note);

    // inclusion check (skip dummy)
    zkusdMap.assertIncluded(
      Provable.if(note.isDummy.not(), commitmentObj.commitment, Field(0)),
    );

    // authorised spender
    Note.assertAuthorizedSpender(note, spendingPublicKey);

    // nullifier must not be present
    zkusdMap.assertNotIncluded(
      Provable.if(
        note.isDummy.not(),
        nullifierObj.nullifier,
        RANDOM_NULLIFIER_SENTINEL,
      ),
    );

    // record nullifier (or dummy)
    nullifiers.nullifiers[i] = nullifierObj;

    valueIn = valueIn.add(note.amount);
  }

  return { valueIn, nullifiers };
}

/**
 * Processes a *single* output note.
 *  • checks that its commitment is fresh
 *  • returns the commitment object and its amount
 */
export function processSingleOutputNote({
  zkusdMap,
  outputNote: note,
}: {
  zkusdMap: ZkUsdMap;
  outputNote: Note;
}): {
  valueOut: UInt64;
  outputNoteCommitment: OutputNoteCommitment;
} {
  const commitmentObj = Note.commitment(note);

  // commitment must be fresh (skip dummy by replacing with sentinel)
  zkusdMap.assertNotIncluded(
    Provable.if(
      note.isDummy.not(),
      commitmentObj.commitment,
      RANDOM_COMMITMENT_SENTINEL,
    ),
  );

  return { valueOut: note.amount, outputNoteCommitment: commitmentObj };
}

/**
 * Processes *output* notes array by delegating to {@link processSingleOutputNote}.
 *  • collects commitments
 *  • tallies the total value out
 */
export function processOutputNotes({
  zkusdMap,
  outputNotes,
}: {
  zkusdMap: ZkUsdMap;
  outputNotes: OutputNotes;
}): {
  valueOut: UInt64;
  outCommitments: OutputNoteCommitments;
} {
  const outCommitments = OutputNoteCommitments.empty();
  let valueOut = UInt64.zero;

  for (let i = 0; i < MAX_OUTPUT_NOTE_COUNT; i++) {
    const note = outputNotes.notes[i];

    const { valueOut: singleVal, outputNoteCommitment: commitmentObj } = processSingleOutputNote({
      zkusdMap,
      outputNote: note,
    });

    // record commitment (or dummy)
    outCommitments.commitments[i] = commitmentObj;

    valueOut = valueOut.add(singleVal);
  }

  return { valueOut, outCommitments };
}

/* ------------------------------------------------------------------ */
/*  Composition helper: combines both routines and returns map update  */
/* ------------------------------------------------------------------ */

/**
 * Common circuit routine combining {@link processInputNotes} and {@link processOutputNotes}.
 *  • verifies & processes input notes
 *  • processes output notes
 *  • builds a ready‑to‑apply {@link ZkusdMapUpdate}
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
  /* ---------- INPUT notes ---------- */
  const { valueIn, nullifiers } = processInputNotes({
    zkusdMap,
    inputNotes,
    spendingSignature,
    spendingPublicKey,
  });

  /* ---------- OUTPUT notes ---------- */
  const { valueOut, outCommitments } = processOutputNotes({
    zkusdMap,
    outputNotes,
  });

  /* ---------- build map update ---------- */
  const zkusdMapUpdate = new ZkusdMapUpdate({
    nullifiers,
    outputNoteCommitments: outCommitments,
  });

  return { valueIn, valueOut, zkusdMapUpdate };
}