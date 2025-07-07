import {
  Field,
  Poseidon,
  Provable,
  PublicKey,
  Signature,
  Struct,
  UInt64,
  ZkProgram,
} from 'o1js';
import { InputNotes, MAX_INPUT_NOTE_COUNT, MAX_OUTPUT_NOTE_COUNT, Nullifier, Nullifiers, OutputNoteCommitment, OutputNoteCommitments, OutputNotes } from '../domain/zkusd/zkusd-note.js';
import { ZkUsdMap } from '../domain/zkusd/zkusd-map.js';
import { FizkRollupState } from '../domain/rollup-state.js';
import { ZkusdMapUpdate } from '../state-updates/zkusd-map-update.js';
import { verifyNoteSnapshotState } from './helpers.js';


export class TransferIntentPreconditions extends Struct({
    noteSnapshotBlockNumber: UInt64, // the number is unbound at the intent level, but it will be used to find and verify the snapshot state at the rollup level.
    noteSnapshotBlockHash: Field,
}) {}

export class TransferIntentOutput extends Struct({
  zkusdMapUpdate: ZkusdMapUpdate,
}) {}

export class TransferIntentPrivateInput extends Struct({
  zkusdMap: ZkUsdMap,
  noteSnapshotState: FizkRollupState,
  inputNotes: InputNotes,
  outputNotes: OutputNotes,
  spendingSignature: Signature,
  spendingPublicKey: PublicKey,
}) {}

export const TransferIntent = ZkProgram({
  name: 'TransferIntent',
  publicInput: TransferIntentPreconditions,
  publicOutput: TransferIntentOutput,
  methods: {
    transfer: {
      privateInputs: [TransferIntentPrivateInput],
      async method(
        publicInput: TransferIntentPreconditions,
        privateInput: TransferIntentPrivateInput & { zkusdMap: ZkUsdMap },
      ): Promise<{ publicOutput: TransferIntentOutput }> {
        const nullifiers = Nullifiers.empty();
        const outputNoteCommitments = OutputNoteCommitments.empty();

        // Verify note snapshot state
        verifyNoteSnapshotState(
          privateInput.noteSnapshotState,
          privateInput.zkusdMap,
          publicInput.noteSnapshotBlockHash
        );

        const {
          inputNotes,
          outputNotes,
          spendingSignature,
          spendingPublicKey,
        } = privateInput;

        let valueIn = UInt64.zero;

        spendingSignature.verify(spendingPublicKey, inputNotes.toFields());

        for (let i = 0; i < MAX_INPUT_NOTE_COUNT; i++) {
          const inN = inputNotes.notes[i];
          const inNHash = inN.hash();
          // TODO: can we have nullifiers that do not depend on spending signature?
        //   const inNNullifier = inN.nullifier(spendingSignature.r);
          // the note should have the same nullifier irrespectively of
          // the method used.
          // using hash can be justified, as nullifiers are only
          // provided via controlled zkprograms
          // so even if someone knew the decrypted note
          // and wanted to maliciously burn it they can only do 
          // so if they have been able to create proofs for the entire intent.
          const inNNullifier = inN.nullifier(inN.hash());


          //We only want to make sure its part of the zkusd map if its not a dummy note
          const inNToCheck = Provable.if(inN.isDummy.not(), inNHash, Field(0));

          privateInput.zkusdMap.assertIncluded(inNToCheck);

          let spenderToCheck = Provable.if(
            inN.isDummy.not(),
            spendingPublicKey,
            PublicKey.empty()
          );

          inN.address.spendingPublicKey.assertEquals(spenderToCheck);

          //Make sure the nullifier is not spent
          privateInput.zkusdMap.assertNotIncluded(inNNullifier);

          const nullifier = Provable.if(
            inN.isDummy.not(),
            Nullifier.create(inNNullifier),
            Nullifier.dummy()
          );

          nullifiers.nullifiers[i] = nullifier;

          valueIn = valueIn.add(inN.amount);
        }

        let valueOut = UInt64.zero;

        for (let i = 0; i < MAX_OUTPUT_NOTE_COUNT; i++) {
          const outN = outputNotes.notes[i];
          const outNHash = outN.hash();

          privateInput.zkusdMap.assertNotIncluded(outNHash);

          const outputNoteCommitment = Provable.if(
            outN.isDummy.not(),
            OutputNoteCommitment.create(outNHash),
            OutputNoteCommitment.dummy()
          );

          outputNoteCommitments.commitments[i] = outputNoteCommitment;

          valueOut = valueOut.add(outN.amount);
        }

        valueIn.assertEquals(valueOut);

        return {
          publicOutput: {
            zkusdMapUpdate: {
              nullifiers,
              outputNoteCommitments,
            },
          },
        };
      },
    },
  },
});

export class TransferIntentProof extends ZkProgram.Proof(TransferIntent) {}