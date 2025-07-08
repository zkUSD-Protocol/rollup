import {
  Field,
  PublicKey,
  Signature,
  Struct,
  UInt64,
  ZkProgram,
} from 'o1js';
import { InputNotes, Note, OutputNotes } from '../domain/zkusd/zkusd-note.js';
import { ZkusdMapUpdate } from '../state-updates/zkusd-map-update.js';
import { ZkUsdMap } from '../domain/zkusd/zkusd-map.js';
import { FizkRollupState } from '../domain/rollup-state.js';
import { verifyNoteSnapshotState } from './helpers.js';
import { BridgeSendIntentUpdate } from '../domain/bridging/io-map-update.js';
import { BridgeConfig } from '../domain/bridging/bridge.js';
import { BridgedAddress } from '../domain/bridging/bridged-address.js';
import { BridgeMap } from '../domain/bridging/bridge-map.js';
import { MerkleRoot } from '../core/map/merkle-root.js';
import { processNotesAndCreateMapUpdate } from './common/note-io-helper.js';

export class BridgeIntentPreconditions extends Struct({
   noteSnapshotBlockNumber: UInt64,
   noteSnapshotBlockHash: Field,
   bridgeMapRoot: MerkleRoot<BridgeMap>,
}) {}

export class BridgeIntentOutput extends Struct({
  zkusdMapUpdate: ZkusdMapUpdate, // spending notes
  bridgeIntentUpdate: BridgeSendIntentUpdate,
}) {}

export class BridgeIntentPrivateInput extends Struct({
  bridgeConfig: BridgeConfig,
  bridgeMap: BridgeMap,
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
}) {}

export const BridgeIntentKey = Field.from('421902410912840918213124091811240') // TODO replace with something more structured

export const BridgeIntent = ZkProgram({
  name: 'BridgeIntent',
  publicInput: BridgeIntentPreconditions,
  publicOutput: BridgeIntentOutput,
  methods: {
    bridge: {
      privateInputs: [BridgeIntentPrivateInput],
      async method(
        publicInput: BridgeIntentPreconditions,
        privateInput: BridgeIntentPrivateInput & { zkusdMap: ZkUsdMap, bridgeMap: BridgeMap }
      ): Promise<{ publicOutput: BridgeIntentOutput }> {
       const {
          inputNotes,
          outputNote,
          spendingSignature,
          spendingPublicKey,
          ownerSignature,
          ownerPublicKey,
          amount,
          zkusdMap,
          noteSnapshotState,
          bridgeConfig,
          bridgeMap 
        } = privateInput;
        // verify the bridge map root
        bridgeMap.getRoot().assertEquals(publicInput.bridgeMapRoot);
        bridgeMap.get(bridgeConfig.code.value.value).assertEquals(bridgeConfig.pack());
        bridgeConfig.depositEnabled.assertEquals(true);

        // verify the snapshot state
        verifyNoteSnapshotState(
          noteSnapshotState,
          zkusdMap,
          publicInput.noteSnapshotBlockHash
        );

        const bridgedAddress = BridgedAddress.fromPublicKey(ownerPublicKey, bridgeConfig.code);

        //Verify the owner signature
        const message = [BridgeIntentKey, bridgedAddress.key, amount.value];
        ownerSignature.verify(ownerPublicKey, message);
        
        const outputNotes = OutputNotes.fromArray([outputNote]);
        const { valueIn, valueOut, zkusdMapUpdate } = processNotesAndCreateMapUpdate({
          zkusdMap,
          inputNotes,
          outputNotes,
          spendingSignature,
          spendingPublicKey,
        });

        //Ensure the input amount is the same as the output amount + the amount to burn
        amount.add(outputNote.amount).assertEquals(valueIn);
        valueOut.assertEquals(outputNote.amount);

        return {
          publicOutput: {
            zkusdMapUpdate,
            bridgeIntentUpdate: new BridgeSendIntentUpdate({
              bridgedAddress: bridgedAddress,
              rollupJustBurned: amount,
            }),
          },
        };
      },
    },
  },
});

export class BridgeIntentProof extends ZkProgram.Proof(BridgeIntent) {}