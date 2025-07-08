import {
  Field,
  PrivateKey,
  PublicKey,
  Signature,
  Struct,
  ZkProgram,
} from 'o1js';
import { VaultAddress } from '../domain/vault/vault-address.js';
import { CreateVaultIntentUpdate, DepositIntentUpdate } from '../domain/vault/vault-update.js';
import { VaultMap } from '../domain/vault/vault-map.js';
import { CollateralType } from '../domain/vault/vault-collateral-type.js';
import { CollateralIoMap } from '../domain/bridging/collateral-io-map.js';
import { MerkleRoot } from '../core/map/merkle-root.js';
import { CollateralIOProof } from '../domain/bridging/prove-collateral-io.js';
import { ObserverMap } from '../domain/enclave/zskud-enclaves-state.js';
import { VaultParameters } from '../domain/vault/vault.js';
/**
 * Generates both public and private inputs for CreateVaultIntent.
 */
export function generateCreateVaultIntentInputs(params: {
  type: CollateralType;
  privateKey: PrivateKey;
}): Promise<{
  publicInput: CreateVaultIntentInput;
  privateInput: CreateVaultIntentPrivateInput;
}> {
  const signatureMsg = [
    params.type.value.value,
    CreateVaultIntentKey,
  ];
  const signature = Signature.create(params.privateKey, signatureMsg);
  return Promise.resolve({
    publicInput: new CreateVaultIntentInput({
    }),
    privateInput: new CreateVaultIntentPrivateInput({
      collateralType: params.type,
      ownerSignature: signature,
      ownerPublicKey: params.privateKey.toPublicKey(),
    }),
  });
}

export class CreateVaultIntentInput extends Struct({
}) {}


export class CreateVaultIntentOutput extends Struct({
    update: CreateVaultIntentUpdate,
}) {}

export class CreateVaultIntentPrivateInput extends Struct({
  collateralType: CollateralType,
  ownerSignature: Signature,
  ownerPublicKey: PublicKey,
}) {}

// todo: make it better?
export const CreateVaultIntentKey = Field.from('420420001');

export const CreateVaultIntent = ZkProgram({
  name: 'CreateVaultIntent',
  publicInput: CreateVaultIntentInput,
  publicOutput: CreateVaultIntentOutput,
  methods: {
    createVault: {
      privateInputs: [CreateVaultIntentPrivateInput],
      async method(
        publicInput: CreateVaultIntentInput,
        privateInput: CreateVaultIntentPrivateInput
      ): Promise<{ publicOutput: CreateVaultIntentOutput }> {
        const { collateralType, ownerSignature, ownerPublicKey } = privateInput;

        // signature message
        const message: Field[] = [
          collateralType.value.value,
          CreateVaultIntentKey,
        ];
        // Validate the owner's signature
        const isValidSignature = ownerSignature.verify(ownerPublicKey, message);
        isValidSignature.assertTrue('Invalid signature');

        // vault key (hiding public key)
        const vaultAddress: VaultAddress = VaultAddress.fromPublicKey(ownerPublicKey, collateralType);

        return {
          publicOutput: new CreateVaultIntentOutput({
            update: new CreateVaultIntentUpdate({
              vaultAddress: vaultAddress,
              collateralType: collateralType,
            }),
          }),
        };
      },
    },
  },
});

// Create proof types for our intent programs
export class CreateVaultIntentProof extends ZkProgram.Proof(
  CreateVaultIntent
) {}
