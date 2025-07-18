import {
  Field,
  PublicKey,
  Signature,
  Struct,
  UInt64,
  ZkProgram,
  DynamicProof,
  FeatureFlags,
} from 'o1js';
import { InputNotes, OutputNotes } from '../domain/zkusd/zkusd-note.js';
import { ZkUsdMap } from '../domain/zkusd/zkusd-map.js';
import { FizkRollupState } from '../domain/rollup-state.js';
import { ZkusdMapUpdate } from '../state-updates/zkusd-map-update.js';
import { verifyNoteSnapshotState } from './helpers.js';
import { processNotesAndCreateMapUpdate } from './common/note-io-helper.js';


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

        const {
          inputNotes,
          outputNotes,
          spendingSignature,
          spendingPublicKey,
          zkusdMap,
          noteSnapshotState,
        } = privateInput;

        // Verify note snapshot state
        verifyNoteSnapshotState(
          noteSnapshotState,
          zkusdMap,
          publicInput.noteSnapshotBlockHash
        );


        const { valueIn, valueOut, zkusdMapUpdate } = processNotesAndCreateMapUpdate({
          zkusdMap,
          inputNotes,
          outputNotes,
          spendingSignature,
          spendingPublicKey,
        });

        valueIn.assertEquals(valueOut);

        return {
          publicOutput: {
            zkusdMapUpdate,
          },
        };
      },
    },
  },
});

export class TransferIntentProof extends ZkProgram.Proof(TransferIntent) {}

const flags = FeatureFlags.allMaybe;
export class TransferIntentDynamicProof extends DynamicProof<TransferIntentPreconditions, TransferIntentOutput> {
  static publicInputType = TransferIntentPreconditions;
  static publicOutputType = TransferIntentOutput;
  static maxProofsVerified = 0 as const;
  static featureFlags = flags;
}
