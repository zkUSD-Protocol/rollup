import { ZkProgram, Field, Struct, Poseidon } from "o1js";
import { FizkRollupState } from "../domain/rollup-state.js";
import { CreateVaultIntentProof } from "../intents/create-vault.js";
import { VaultMap } from "../domain/vault/vault-map.js";
import { CollateralIoMap } from "../domain/bridging/collateral-io-map.js";
import { CollateralIOAccumulators } from "../domain/bridging/collateral-io-accumulators.js";
import { getRoot } from "../core/map/merkle-root.js";
import { ComputationStepOutput, getComputationStepOutput } from "./common.js";
import { IntentInclusionMap } from "../domain/block-info/intent-inclusion-map.js";

export class CreateVaultPrivateInput extends Struct({
  rollupState: FizkRollupState,
	proof: CreateVaultIntentProof,
	vaultMap: VaultMap,
  intentInclusionMap: IntentInclusionMap,
	iomap: CollateralIoMap,
}) {}

export const CreateVaultComputation = ZkProgram({
  name: "CreateVaultComputation",
  publicInput: Field,
  publicOutput: ComputationStepOutput,
  methods: {
    createVault: {
      privateInputs: [CreateVaultPrivateInput],
      async method(
        publicInput: Field,
        privateInput: CreateVaultPrivateInput & {
          proof: CreateVaultIntentProof;
          vaultMap: VaultMap;
          iomap: CollateralIoMap;
          intentInclusionMap: IntentInclusionMap;
        },
      ): Promise<{ publicOutput: ComputationStepOutput }> {
        const state = privateInput.rollupState;
        const initialStateHash = Poseidon.hash(state.toFields());
        initialStateHash.assertEquals(publicInput);
        privateInput.proof.verify();

        const verifiedVaultUpdate = VaultMap.verifyCreateVaultUpdate(
          privateInput.vaultMap,
          state.vaultState,
          privateInput.proof.publicOutput.update,
        );

        const ioMap = privateInput.iomap;
        getRoot(ioMap).assertEquals(state.vaultState.collateralIoMapRoot);
        ioMap.insert(
          privateInput.proof.publicOutput.update.vaultAddress.key,
          CollateralIOAccumulators.empty().pack(),
        );
        state.vaultState.collateralIoMapRoot = getRoot(ioMap);

        const vaultMap = privateInput.vaultMap;
        const newVaultMapRoot = VaultMap.verifiedInsert(
          vaultMap,
          verifiedVaultUpdate,
        );
        state.vaultState.vaultMapRoot = newVaultMapRoot;

        //
        const intentInclusionMap = privateInput.intentInclusionMap;
        const intentsIncluded = state.blockInfoState.includedIntents;
        getRoot(intentInclusionMap).assertEquals(state.blockInfoState.intentInclusionMerkleRoot);
        intentInclusionMap.insert(
          intentsIncluded.value,
          privateInput.proof.publicOutput.inclusionHash,
        );
        state.blockInfoState.intentInclusionMerkleRoot = getRoot(intentInclusionMap);
        state.blockInfoState.includedIntents = intentsIncluded.add(1);

        return { publicOutput: getComputationStepOutput(state) };
      },
    },
  },
});
      
// proof class
export class CreateVaultComputationProof extends ZkProgram.Proof(CreateVaultComputation) {}
    