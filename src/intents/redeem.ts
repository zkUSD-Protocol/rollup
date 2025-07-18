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
import { VaultAddress } from '../domain/vault/vault-address.js';
import { RedeemCollateralUpdate } from '../domain/vault/vault-update.js';
import { CollateralType } from '../domain/vault/vault-collateral-type.js';
import { VaultParameters } from '../domain/vault/vault.js';

export class RedeemIntentPreconditions extends Struct({
  vaultParameters: VaultParameters,
}) {}

export class RedeemIntentOutput extends Struct({
  update: RedeemCollateralUpdate,
}) {}

export class RedeemIntentPrivateInput extends Struct({
  ownerSignature: Signature,
  ownerPublicKey: PublicKey,
  amount: UInt64,
  collateralType: CollateralType,
}) {}

// todo: make it better?
export const RedeemIntentKey = Field.from('420420003');

export const RedeemIntent = ZkProgram({
  name: 'RedeemIntent',
  publicInput: RedeemIntentPreconditions,
  publicOutput: RedeemIntentOutput,
  methods: {
    redeem: {
      privateInputs: [RedeemIntentPrivateInput],
      async method(
        publicInput: RedeemIntentPreconditions,
        privateInput: RedeemIntentPrivateInput,
      ): Promise<{ publicOutput: RedeemIntentOutput }> {

        const { ownerSignature, ownerPublicKey, amount } = privateInput;

        // signature message todo: make it better
        const message: Field[] = [RedeemIntentKey, privateInput.collateralType.value.value, amount.value];

        // Validate the owner's signature
        const isValidSignature = ownerSignature.verify(ownerPublicKey, message);
        isValidSignature.assertTrue('Invalid signature');

        const vaultAddress = VaultAddress.fromPublicKey(ownerPublicKey, privateInput.collateralType);

        return {
          publicOutput: new RedeemIntentOutput({
            update: new RedeemCollateralUpdate({vaultAddress, collateralDelta: amount, collateralType: privateInput.collateralType}),
          }),
        };
      },
    },
  },
});

export class RedeemIntentProof extends ZkProgram.Proof(RedeemIntent) {}

const flags = FeatureFlags.allMaybe;
export class RedeemIntentDynamicProof extends DynamicProof<RedeemIntentPreconditions, RedeemIntentOutput> {
  static publicInputType = RedeemIntentPreconditions;
  static publicOutputType = RedeemIntentOutput;
  static maxProofsVerified = 0 as const;
  static featureFlags = flags;
}
