import {
  Field,
  Poseidon,
  PublicKey,
  Signature,
  Struct,
  UInt64,
  ZkProgram,
} from 'o1js';
import { ZkUsdMap } from '../domain/zkusd/zkusd-map.js';
import { Note, Nullifiers, OutputNoteCommitments } from '../domain/zkusd/zkusd-note.js';
import { VaultAddress } from '../domain/vault/vault-address.js';
import { ZkusdMapUpdate } from '../state-updates/zkusd-map-update.js';
import { CollateralType } from '../domain/vault/vault-collateral-type.js';
import { MintIntentUpdate } from '../domain/vault/vault-update.js';
import { FizkRollupState } from '../domain/rollup-state.js';

export class MintIntentPreconditions extends Struct({
    collateralPriceNanoUsd: UInt64,
    rollupStateHash: Field,
    rollupStateBlockNumber: UInt64,
}) {}

export class MintIntentOutput extends Struct({
    vaultUpdate: MintIntentUpdate,
    zkusdMapUpdate: ZkusdMapUpdate,
}) {}

export class MintIntentPrivateInput extends Struct({
  note: Note,
  collateralType: CollateralType,
  ownerSignature: Signature,
  ownerPublicKey: PublicKey,
  rollupState: FizkRollupState,
}) {}

const MintIntentKey = Field.from('42190241091284091824091811240') // TODO replace with something more structured

export const MintIntent = ZkProgram({
  name: 'MintIntent',
  publicInput: MintIntentPreconditions,
  publicOutput: MintIntentOutput,
  methods: {
    mint: {
      privateInputs: [MintIntentPrivateInput],
      async method(
        publicInput: MintIntentPreconditions,
        privateInput: MintIntentPrivateInput & { zkusdMap: ZkUsdMap }
      ): Promise<{ publicOutput: MintIntentOutput }> {
        const {
          note,
          collateralType,
          ownerPublicKey,
          rollupState,
          ownerSignature,
        } = privateInput;

        // verify rollup state hash
        Poseidon.hash(rollupState.toFields()).assertEquals(publicInput.rollupStateHash);

        // verify signature
        const message = [MintIntentKey, Note.hash(note)]
        ownerSignature.verify(ownerPublicKey, message);

        const vaultAddress = VaultAddress.fromPublicKey(ownerPublicKey, collateralType);

        const vaultUpdate = new MintIntentUpdate({
          vaultAddress: vaultAddress,
          debtDelta: note.amount,
          collateralType: collateralType,
        });

        return {
          publicOutput: {
            vaultUpdate,
            zkusdMapUpdate: new ZkusdMapUpdate({
              nullifiers: Nullifiers.empty(),
              outputNoteCommitments: new OutputNoteCommitments({commitments: [Note.commitment(note)]})
            }),
          },
        };
      },
    },
  },
});

export class MintIntentProof extends ZkProgram.Proof(MintIntent) {}