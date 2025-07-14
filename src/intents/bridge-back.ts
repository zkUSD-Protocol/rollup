import {
  Field,
  PublicKey,
  Signature,
  Struct,
  UInt32,
  UInt64,
  ZkProgram,
} from 'o1js';
import { Note, Nullifiers, OutputNoteCommitments, OutputNotes } from '../domain/zkusd/zkusd-note.js';
import { ZkusdMapUpdate } from '../state-updates/zkusd-map-update.js';
import { ZkUsdMap } from '../domain/zkusd/zkusd-map.js';
import { BridgeBackIntentUpdate } from '../domain/bridging/io-map-update.js';
import { BridgedAddress } from '../domain/bridging/bridged-address.js';
import { BridgeMap } from '../domain/bridging/bridge-map.js';
import { MerkleRoot } from '../core/map/merkle-root.js';
import { ObserverMap } from '../domain/enclave/observer-map.js';
import { ObserverBridgeStateAttestationProof } from '../prove/observer/zkusd-bridge-state.js';

export class BridgeIntentPreconditions extends Struct({
  observerMapRoot: MerkleRoot<ObserverMap>,
  totalAmountBridgedBack: UInt64, // prevents replay attacks
}) {}

export class BridgeIntentOutput extends Struct({
  zkusdMapUpdate: ZkusdMapUpdate, // minting notes
  bridgeIntentUpdate: BridgeBackIntentUpdate,
  observersSignedCount: UInt32,
}) {}

export class BridgeIntentPrivateInput extends Struct({
  bridgeStateProof: ObserverBridgeStateAttestationProof,
  outputNote: Note,
  ownerPublicKey: PublicKey,
  ownerSignature: Signature,
}) {}

export const BridgeBackIntentKey = Field.from('4219234295151564109128409182131283492119874256124091811240') // TODO replace with something more structured

export const BridgeBackIntent = ZkProgram({
  name: 'BridgeBackIntent',
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
          bridgeStateProof,
          outputNote,
          ownerPublicKey,
          ownerSignature,
        } = privateInput;
        
        // verify the proof
        bridgeStateProof.verify();

        const bridgeCode = bridgeStateProof.publicOutput.bridgeCode;
        const bridgedAddress = BridgedAddress.fromPublicKey(ownerPublicKey, bridgeCode);
        const mintAmount = outputNote.amount;

        //Verify the owner signature
        const message = [BridgeBackIntentKey, bridgedAddress.key, publicInput.totalAmountBridgedBack.value, mintAmount.value];
        ownerSignature.verify(ownerPublicKey, message);

        const outputNoteCommitments = OutputNoteCommitments.empty();
        outputNoteCommitments.commitments[0] = Note.commitment(outputNote);

        return {
          publicOutput: {
            zkusdMapUpdate: new ZkusdMapUpdate({
              nullifiers: Nullifiers.empty(),
              outputNoteCommitments 
            }),
            bridgeIntentUpdate: new BridgeBackIntentUpdate({
              bridgedAddress,
              bridgeTotalBurned: bridgeStateProof.publicOutput.provenBridgeStateAccumulators.totalBurned,
              mintAmount,
            }),
            observersSignedCount: bridgeStateProof.publicOutput.observersSigned,
          },
        };
      },
    },
  },
});

export class BridgeBackIntentProof extends ZkProgram.Proof(BridgeBackIntent) {}