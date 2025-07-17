
import {
  Field,
  PublicKey,
  Signature,
  Struct,
  UInt64,
  ZkProgram,
} from 'o1js';
import { InputNotes, Note, OutputNotes } from '../domain/zkusd/zkusd-note.js';
import { DebtRepaymentUpdate } from '../domain/vault/vault-update.js';
import { VaultAddress } from '../domain/vault/vault-address.js';
import { VaultParameters } from '../domain/vault/vault.js';
import { ZkusdMapUpdate } from '../state-updates/zkusd-map-update.js';
import { CollateralType } from '../domain/vault/vault-collateral-type.js';
import { ZkUsdMap } from '../domain/zkusd/zkusd-map.js';
import { FizkRollupState } from '../domain/rollup-state.js';
import { verifyNoteSnapshotState } from './helpers.js';
import { processNotesAndCreateMapUpdate } from './common/note-io-helper.js';

/* ------------------------------------------------------------------ */
/*  Public-input / public-output structs                              */
/* ------------------------------------------------------------------ */

export class BurnIntentPreconditions extends Struct({
  vaultParameters:    VaultParameters,
  noteSnapshotBlockNumber: UInt64,
  noteSnapshotBlockHash:   Field,
}) {}

export class BurnIntentOutput extends Struct({
  vaultUpdate:    DebtRepaymentUpdate,
  zkusdMapUpdate: ZkusdMapUpdate,
}) {}

/* ------------------------------------------------------------------ */
/*  Private input                                                     */
/* ------------------------------------------------------------------ */

export class BurnIntentPrivateInput extends Struct({
  zkusdMap:            ZkUsdMap,
  noteSnapshotState:   FizkRollupState,
  inputNotes:          InputNotes,
  outputNote:          Note,
  spendingSignature:   Signature,
  spendingPublicKey:   PublicKey,
  nullifierKey:        Field,
  ownerSignature:      Signature,
  ownerPublicKey:      PublicKey,
  amount:              UInt64,
  collateralType:      CollateralType,
}) {}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

export const BurnIntentKey = Field.from(
  '421902410912840918213124091811240', // TODO: replace with something structured
);

/* ------------------------------------------------------------------ */
/*  ZkProgram                                                         */
/* ------------------------------------------------------------------ */

export const BurnIntent = ZkProgram({
  name:        'BurnIntent',
  publicInput: BurnIntentPreconditions,
  publicOutput: BurnIntentOutput,

  methods: {
    burn: {
      privateInputs: [BurnIntentPrivateInput],

      async method(
        publicInput:  BurnIntentPreconditions,
        privateInput: BurnIntentPrivateInput & { zkusdMap: ZkUsdMap },
      ): Promise<{ publicOutput: BurnIntentOutput }> {

        /* ---------------- unpack ---------------- */
        const {
          inputNotes,
          outputNote,
          spendingSignature,
          spendingPublicKey,
          collateralType,
          ownerSignature,
          ownerPublicKey,
          amount,
          zkusdMap,
          noteSnapshotState,
        } = privateInput;

        /* ---------- 1. verify the snapshot root ---------- */
        verifyNoteSnapshotState(
          noteSnapshotState,
          zkusdMap,
          publicInput.noteSnapshotBlockHash,
        );

        /* ---------- 2. verify vault-owner signature ------- */
        const vaultAddress = VaultAddress.fromPublicKey(
          ownerPublicKey,
          collateralType,
        );

        const ownerMsg = [BurnIntentKey, vaultAddress.key, amount.value];
        ownerSignature.verify(ownerPublicKey, ownerMsg);

        /* ---------- 3. common note/nullifier processing --- */
        const outputNotes = OutputNotes.empty();
        outputNotes.notes[0] = outputNote;
        const { valueIn, valueOut, zkusdMapUpdate } = processNotesAndCreateMapUpdate({
          zkusdMap,
          inputNotes,
          outputNotes,
          spendingSignature,
          spendingPublicKey,
        });

        /* ---------- 4. value-consistency assertion -------- */
        amount.add(outputNote.amount).assertEquals(valueIn);
        valueOut.assertEquals(outputNote.amount)

        /* ---------- 5. vault debt delta ------------------- */
        const vaultUpdate = new DebtRepaymentUpdate({
          vaultAddress,
          debtDelta: amount,
          collateralType,
        });

        /* ---------- 6. return public output --------------- */
        return {
          publicOutput: {
            vaultUpdate,
            zkusdMapUpdate,
          },
        };
      },
    },
  },
});

/* ------------------------------------------------------------------ */
/*  Proof type                                                        */
/* ------------------------------------------------------------------ */

export class BurnIntentProof extends ZkProgram.Proof(BurnIntent) {}