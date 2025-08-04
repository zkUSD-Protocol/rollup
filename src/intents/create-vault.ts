import {
  DynamicProof,
  FeatureFlags,
  Field,
  Poseidon,
  PrivateKey,
  PublicKey,
  Signature,
  Struct,
  ZkProgram,
} from 'o1js';
import { VaultAddress } from '../domain/vault/vault-address.js';
import { CreateVaultIntentUpdate } from '../domain/vault/vault-update.js';
import { CollateralType } from '../domain/vault/vault-collateral-type.js';

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
      secretMemo: Field.random(),
    }),
  });
}

export class CreateVaultIntentInput extends Struct({
}) {}


export class CreateVaultIntentOutput extends Struct({
    update: CreateVaultIntentUpdate,
    inclusionHash: Field,
}) {}

export class CreateVaultIntentPrivateInput extends Struct({
  collateralType: CollateralType,
  ownerSignature: Signature,
  ownerPublicKey: PublicKey,
  secretMemo: Field,
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

        // this can be used in an outside program to prove that:
        // 0. this particular intent was included
        // 1. the vault exists
        // 2. one owns the private key that created the vault
        // 3. one knows the secret memo
        const inclusionProof: Field[] = [
          CreateVaultIntentKey,
          collateralType.value.value,
          ...ownerPublicKey.toFields(),
          privateInput.secretMemo,
        ];
        const inclusionHash = Poseidon.hash(inclusionProof);

        return {
          publicOutput: new CreateVaultIntentOutput({
            update: new CreateVaultIntentUpdate({
              vaultAddress: vaultAddress,
              collateralType: collateralType,
            }),
            inclusionHash: inclusionHash,
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