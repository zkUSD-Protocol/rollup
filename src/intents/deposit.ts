import {
  Field,
  PublicKey,
  Signature,
  Struct,
  UInt64,
  ZkProgram,
} from 'o1js';
import { VaultAddress } from '../domain/vault/vault-address.js';
import { DepositIntentUpdate } from '../domain/vault/vault-update.js';
import { VaultMap } from '../domain/vault/vault-map.js';
import { CollateralType } from '../domain/vault/vault-collateral-type.js';
import { IoMap } from '../domain/bridging/io-map.js';
import { MerkleRoot } from '../core/map/merkle-root.js';
import { CollateralIOProof } from '../domain/bridging/prove-collateral-io.js';
import { ObserverMap } from '../domain/enclave/zskud-enclaves-state.js';
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
        privateInput: DepositPrivateInput & { vaultMap: VaultMap, iomap: IoMap },
      ): Promise<{ publicOutput: DepositIntentOutput }> {

        const { collateralIOProof, ownerSignature, ownerPublicKey, amount } = privateInput;
        const totalDeposits = collateralIOProof.publicOutput.totalDeposits;
        
        // verify the io proof
        collateralIOProof.verify();
        // also against public input
        collateralIOProof.publicOutput.observerKeysMerkleRoot.assertEquals(publicInput.observerKeysMerkleRoot);
        // and address
        const vaultAddress: VaultAddress = VaultAddress.fromPublicKey(ownerPublicKey, privateInput.collateralType);
        collateralIOProof.publicOutput.vaultAddress.assertEquals(vaultAddress);

        // signature message todo: make it better
        const message: Field[] = [DepositIntentKey, privateInput.collateralType.value.value, amount, totalDeposits.value, ];

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
