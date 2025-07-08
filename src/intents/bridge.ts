// import {
//   Field,
//   Proof,
//   Provable,
//   PublicKey,
//   Signature,
//   Struct,
//   UInt64,
//   ZkProgram,
// } from 'o1js';
// import { InputNotes, MAX_INPUT_NOTE_COUNT, Note, Nullifier, Nullifiers, OutputNoteCommitment, OutputNoteCommitments } from '../domain/zkusd/zkusd-note.js';
// import { BridgeIntentUpdate, DebtRepaymentIntentUpdate } from '../domain/vault/vault-update.js';
// import { VaultAddress } from '../domain/vault/vault-address.js';
// import { VaultParameters } from '../domain/vault/vault.js';
// import { ZkusdMapUpdate } from '../state-updates/zkusd-map-update.js';
// import { CollateralType } from '../domain/vault/vault-collateral-type.js';
// import { ZkUsdMap } from '../domain/zkusd/zkusd-map.js';
// import { FizkRollupState } from '../domain/rollup-state.js';
// import { verifyNoteSnapshotState } from './helpers.js';
// import { IoMapUpdate } from '../domain/bridging/io-map-update.js';

// export class BridgeIntentPreconditions extends Struct({
//    noteSnapshotBlockNumber: UInt64,
//    noteSnapshotBlockHash: Field,
// }) {}

// export class BridgeIntentOutput extends Struct({
//   zkusdMapUpdate: ZkusdMapUpdate, // spending notes
//   zkusdIoMapUpdate: BridgeIntentUpdate,
// }) {}

// export class BridgeIntentPrivateInput extends Struct({
//   zkusdMap: ZkUsdMap,
//   noteSnapshotState: FizkRollupState,
//   inputNotes: InputNotes,
//   outputNote: Note,
//   spendingSignature: Signature,
//   spendingPublicKey: PublicKey,
//   nullifierKey: Field,
//   ownerSignature: Signature,
//   ownerPublicKey: PublicKey,
//   amount: UInt64,
//   collateralType: CollateralType,
// }) {}

// export const BridgeIntentKey = Field.from('421902410912840918213124091811240') // TODO replace with something more structured

// export const BridgeIntent = ZkProgram({
//   name: 'BridgeIntent',
//   publicInput: BridgeIntentPreconditions,
//   publicOutput: BridgeIntentOutput,
//   methods: {
//     bridge: {
//       privateInputs: [BridgeIntentPrivateInput],
//       async method(
//         publicInput: BridgeIntentPreconditions,
//         privateInput: BridgeIntentPrivateInput & { zkusdMap: ZkUsdMap }
//       ): Promise<{ publicOutput: BridgeIntentOutput }> {
//         const nullifiers = Nullifiers.empty();

//         const {
//           inputNotes,
//           outputNote,
//           spendingSignature,
//           spendingPublicKey,
//           nullifierKey,
//           collateralType,
//           ownerSignature,
//           ownerPublicKey,
//           amount,
//           zkusdMap,
//           noteSnapshotState
//         } = privateInput;

//         // verify the snapshot state
//         verifyNoteSnapshotState(
//           noteSnapshotState,
//           zkusdMap,
//           publicInput.noteSnapshotBlockHash
//         );

//         const vaultAddress = VaultAddress.fromPublicKey(ownerPublicKey, collateralType);

//         //Verify the owner signature
//         const message = [BridgeIntentKey, vaultAddress.key, amount.value];
//         ownerSignature.verify(ownerPublicKey, message);
//         spendingSignature.verify(spendingPublicKey, inputNotes.toFields());

//         let valueIn = UInt64.zero;

//         for (let i = 0; i < MAX_INPUT_NOTE_COUNT; i++) {
//           const inN = inputNotes.notes[i];
//           const inNHash = inN.hash();
//           const inNNullifier = inN.nullifier(nullifierKey);

//           //We only want to make sure its part of the zkusd map if its not a dummy note
//           const inNToCheck = Provable.if(inN.isDummy.not(), inNHash, Field(0));

//           zkusdMap.assertIncluded(inNToCheck);

//           let spenderToCheck = Provable.if(
//             inN.isDummy.not(),
//             spendingPublicKey,
//             PublicKey.empty()
//           );

//           inN.address.spendingPublicKey.assertEquals(spenderToCheck);

//           //Make sure the nullifier is not spent
//           zkusdMap.assertNotIncluded(inNNullifier);

//           const nullifier = Provable.if(
//             inN.isDummy.not(),
//             Nullifier.create(inNNullifier),
//             Nullifier.dummy()
//           );

//           nullifiers.nullifiers[i] = nullifier;

//           valueIn = valueIn.add(inN.amount);
//         }

//         const outN = outputNote;
//         const outputNoteCommitment = OutputNoteCommitment.create(outN.hash());
//         zkusdMap.assertNotIncluded(outputNoteCommitment.commitment);

//         //Ensure the input amount is the same as the output amount + the amount to burn
//         amount.add(outN.amount).assertEquals(valueIn);

//         //Create the zkusd map update
//         const zkusdMapUpdate = new ZkusdMapUpdate({
//           nullifiers,
//           outputNoteCommitments: new OutputNoteCommitments({commitments: [outputNoteCommitment]}),
//         });

//         return {
//           publicOutput: {
//             zkusdMapUpdate: zkusdMapUpdate,
//             zkusdIoMapUpdate: new BridgeIntentUpdate({
//               vaultAddress: vaultAddress,
//               amount: amount,
//             }),
//           },
//         };
//       },
//     },
//   },
// });

// export class BridgeIntentProof extends ZkProgram.Proof(BridgeIntent) {}