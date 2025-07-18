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
import { DepositIntentUpdate } from '../domain/vault/vault-update.js';
import { VaultMap } from '../domain/vault/vault-map.js';
import { CollateralType } from '../domain/vault/vault-collateral-type.js';
import { CollateralIoMap } from '../domain/bridging/collateral-io-map.js';
import { MerkleRoot } from '../core/map/merkle-root.js';
import { CollateralIOProof } from '../domain/bridging/prove-collateral-io.js';
import { ObserverMap } from '../domain/enclave/observer-map.js';
import { VaultParameters } from '../domain/vault/vault.js';

export class DepositIntentPreconditions extends Struct({
  vaultParameters: VaultParameters,
  observerKeysMerkleRoot: MerkleRoot<ObserverMap>,
}) {}

export class DepositIntentOutput extends Struct({
  update: DepositIntentUpdate,
}) {}

export class DepositPrivateInput extends Struct({
  collateralIOProof: CollateralIOProof,
  ownerSignature: Signature,
  ownerPublicKey: PublicKey,
  amount: UInt64,
  collateralType: CollateralType,
}) {}

// todo: make it better?
export const DepositIntentKey = Field.from('420420002');

export const DepositIntent = ZkProgram({
  name: 'DepositIntent',
  publicInput: DepositIntentPreconditions,
  publicOutput: DepositIntentOutput,
  methods: {
    deposit: {
      privateInputs: [DepositPrivateInput],
      async method(
        publicInput: DepositIntentPreconditions,
        privateInput: DepositPrivateInput & { vaultMap: VaultMap, iomap: CollateralIoMap },
      ): Promise<{ publicOutput: DepositIntentOutput }> {

        const { collateralIOProof, ownerSignature, ownerPublicKey, amount } = privateInput;
        const totalDeposits = collateralIOProof.publicOutput.ioAccumulators.totalDeposits;
        
        // verify the io proof
        collateralIOProof.verify();
        // also against public input
        collateralIOProof.publicOutput.oracleKeysMerkleRoot.assertEquals(publicInput.observerKeysMerkleRoot);
        // and address
        const vaultAddress: VaultAddress = VaultAddress.fromPublicKey(ownerPublicKey, privateInput.collateralType);
        collateralIOProof.publicOutput.vaultAddress.key.assertEquals(vaultAddress.key);

        // signature message todo: make it bette
        const message: Field[] = [DepositIntentKey, privateInput.collateralType.value.value, amount.value, totalDeposits.value, ];

        // Validate the owner's signature
        const isValidSignature = ownerSignature.verify(ownerPublicKey, message);
        isValidSignature.assertTrue('Invalid signature');

        return {
          publicOutput: new DepositIntentOutput({
            update: new DepositIntentUpdate({vaultAddress, collateralDelta: amount, newIoMapTotalDeposits: totalDeposits, collateralType: privateInput.collateralType}),
          }),
        };
      },
    },
  },
});

export class DepositIntentProof extends ZkProgram.Proof(DepositIntent) {}

const flags = FeatureFlags.allNone;
export class DepositIntentDynamicProof extends DynamicProof<DepositIntentPreconditions, DepositIntentOutput> {
  static publicInputType = DepositIntentPreconditions;
  static publicOutputType = DepositIntentOutput;
  static maxProofsVerified = 0 as const;
  static featureFlags = flags;
}
