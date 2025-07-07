import {
  Field,
  Provable,
  PublicKey,
  Signature,
  Struct,
  UInt64,
  ZkProgram,
} from 'o1js';
import { InputNotes, MAX_INPUT_NOTE_COUNT, Note, Nullifier, Nullifiers, OutputNoteCommitment, OutputNoteCommitments } from '../domain/zkusd/zkusd-note.js';
import { DebtRepaymentIntentUpdate } from '../domain/vault/vault-update.js';
import { VaultAddress } from '../domain/vault/vault-address.js';
import { Vault, VaultParameters } from '../domain/vault/vault.js';
import { ZkusdMapUpdate } from '../state-updates/zkusd-map-update.js';
import { CollateralType } from '../domain/vault/vault-collateral-type.js';
import { ZkUsdMap } from '../domain/zkusd/zkusd-map.js';
import { FizkRollupState } from '../domain/rollup-state.js';
import { verifyNoteSnapshotState } from './helpers.js';

// it is assumed that the intent submitter / vault owner, wants to act
// against a particular vault parameters, so we set them as precondtions 
export class BurnIntentPreconditions extends Struct({
   vaultParameters: VaultParameters,
   noteSnapshotBlockNumber: UInt64,
   noteSnapshotBlockHash: Field,
}) {}


// intended updates to the protocol state
// it contains a vault update that decreases the debt of the vault
// and a zkusd map update that marks notes as spent
export class BurnIntentOutput extends Struct({
  vaultUpdate: DebtRepaymentIntentUpdate,
  zkusdMapUpdate: ZkusdMapUpdate,
}) {}

export class BurnIntentPrivateInput extends Struct({
  zkusdMap: ZkUsdMap,
  noteSnapshotState: FizkRollupState,
  inputNotes: InputNotes,
  outputNote: Note,
  spendingSignature: Signature,
  spendingPublicKey: PublicKey,
  nullifierKey: Field,
  ownerSignature: Signature,
  ownerPublicKey: PublicKey,
  amount: UInt64,
  collateralType: CollateralType,
}) {}

export const BurnIntent = ZkProgram({
  name: 'BurnIntent',
  publicInput: BurnIntentPreconditions,
  publicOutput: BurnIntentOutput,
  methods: {
    burn: {
      privateInputs: [BurnIntentPrivateInput],
      async method(
        publicInput: BurnIntentPreconditions,
        privateInput: BurnIntentPrivateInput & { zkusdMap: ZkUsdMap }
      ): Promise<{ publicOutput: BurnIntentOutput }> {
        const nullifiers = Nullifiers.empty();

        const {
          inputNotes,
          outputNote,
          spendingSignature,
          spendingPublicKey,
          nullifierKey,
          collateralType,
          ownerSignature,
          ownerPublicKey,
          amount,
          zkusdMap,
          noteSnapshotState
        } = privateInput;

        // verify the snapshot state
        verifyNoteSnapshotState(
          noteSnapshotState,
          zkusdMap,
          publicInput.noteSnapshotBlockHash
        );

        const vaultAddress = VaultAddress.fromPublicKey(ownerPublicKey, collateralType);

        //Get the vault
        const vault = Vault(publicInput.vaultParameters).unpack(zkusdMap.get(vaultAddress.key));

        //Verify the owner signature
        ownerSignature.verify(ownerPublicKey, vault.toFields());

        spendingSignature.verify(spendingPublicKey, inputNotes.toFields());

        let valueIn = UInt64.zero;

        for (let i = 0; i < MAX_INPUT_NOTE_COUNT; i++) {
          const inN = inputNotes.notes[i];
          const inNHash = inN.hash();
          const inNNullifier = inN.nullifier(nullifierKey);

          //We only want to make sure its part of the zkusd map if its not a dummy note
          const inNToCheck = Provable.if(inN.isDummy.not(), inNHash, Field(0));

          zkusdMap.assertIncluded(inNToCheck);

          let spenderToCheck = Provable.if(
            inN.isDummy.not(),
            spendingPublicKey,
            PublicKey.empty()
          );

          inN.address.spendingPublicKey.assertEquals(spenderToCheck);

          //Make sure the nullifier is not spent
          zkusdMap.assertNotIncluded(inNNullifier);

          const nullifier = Provable.if(
            inN.isDummy.not(),
            Nullifier.create(inNNullifier),
            Nullifier.dummy()
          );

          nullifiers.nullifiers[i] = nullifier;

          valueIn = valueIn.add(inN.amount);
        }

        const outN = outputNote;
        const outputNoteCommitment = OutputNoteCommitment.create(outN.hash());
        zkusdMap.assertNotIncluded(outputNoteCommitment.commitment);

        //Ensure the input amount is the same as the output amount + the amount to burn
        amount.add(outN.amount).assertEquals(valueIn);

        //Burn the zkusd
        vault.repayDebt(amount);

        //Create the vault update
        const vaultUpdate = new DebtRepaymentIntentUpdate({
          vaultAddress: vaultAddress,
          debtDelta: amount,
          collateralType: collateralType,
        });

        //Create the zkusd map update
        const zkusdMapUpdate = new ZkusdMapUpdate({
          nullifiers,
          outputNoteCommitments: new OutputNoteCommitments({commitments: [outputNoteCommitment]}),
        });

        return {
          publicOutput: {
            vaultUpdate,
            zkusdMapUpdate: zkusdMapUpdate,
          },
        };
      },
    },
  },
});

export class BurnIntentProof extends ZkProgram.Proof(BurnIntent) {}