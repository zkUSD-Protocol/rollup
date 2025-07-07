import {
  Field,
  PublicKey,
  Signature,
  Struct,
  UInt64,
  ZkProgram,
} from 'o1js';
import { ZkUsdMap } from '../domain/zkusd/zkusd-map.js';
import { Note, Nullifiers, OutputNoteCommitment, OutputNoteCommitments } from '../domain/zkusd/zkusd-note.js';
import { VaultMap } from '../domain/vault/vault-map.js';
import { Vault, VaultParameters } from '../domain/vault/vault.js';
import { VaultAddress } from '../domain/vault/vault-address.js';
import { ZkusdMapUpdate } from '../state-updates/zkusd-map-update.js';
import { CollateralType } from '../domain/vault/vault-collateral-type.js';
import { MintIntentUpdate } from '../domain/vault/vault-update.js';

export class MintIntentPreconditions extends Struct({
    vaultParameters: VaultParameters,
    collateralPriceNanoUsd: UInt64,
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
  vaultMap: VaultMap,
}) {}

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
          ownerSignature,
          ownerPublicKey,
          vaultMap,
        } = privateInput;

        const vaultAddress = VaultAddress.fromPublicKey(ownerPublicKey, collateralType);

        //Get the vault
        const vault = Vault(publicInput.vaultParameters).unpack(vaultMap.get(vaultAddress.key));

        //Verify the owner signature
        ownerSignature.verify(ownerPublicKey, vault.toFields());

        //Mint the zkusd
        vault.mintZkUsd(note.amount, publicInput.collateralPriceNanoUsd);

        const outputNoteCommitment = OutputNoteCommitment.create(note.hash());

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
              outputNoteCommitments: new OutputNoteCommitments({commitments: [outputNoteCommitment]})
            }),
          },
        };
      },
    },
  },
});

export class MintIntentProof extends ZkProgram.Proof(MintIntent) {}