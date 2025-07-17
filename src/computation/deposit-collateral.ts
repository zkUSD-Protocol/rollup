import { ZkProgram, Field, Struct, Poseidon } from "o1js";
import { FizkRollupState } from "../domain/rollup-state.js";
import { DepositIntentProof } from "../intents/deposit.js";
import { VaultMap } from "../domain/vault/vault-map.js";
import { CollateralIoMap } from "../domain/bridging/collateral-io-map.js";
import { getRoot } from "../core/map/merkle-root.js";
import { ComputationStepOutput, getActualVaultParams, getComputationStepOutput } from "./common.js";


export class DepositCollateralPrivateInput extends Struct({
  rollupState: FizkRollupState,
  proof:         DepositIntentProof,
  vaultMap:      VaultMap,
  iomap:         CollateralIoMap,
}) {}

export const DepositCollateralComputation = ZkProgram({
  name: "DepositCollateralComputation",
  publicInput:  Field,   // commitment to the pre-state
  publicOutput: ComputationStepOutput,   // commitment to the post-state
  methods: {
    depositCollateral: {
      privateInputs: [DepositCollateralPrivateInput],
      async method(
        publicInput: Field,
        privateInput: DepositCollateralPrivateInput &
          { proof: DepositIntentProof; vaultMap: VaultMap; iomap: CollateralIoMap },
      ): Promise<{ publicOutput: ComputationStepOutput }> {
        /* ---------------------------------------------------- *
         * 0. Bind variables & check the incoming commitment
         * ---------------------------------------------------- */
        const state = privateInput.rollupState;

        // commitment(rollupState_pre) must equal the public input
        Poseidon.hash(state.toFields()).assertEquals(publicInput);

        /* ---------------------------------------------------- *
         * 1. Verify the intent proof
         * ---------------------------------------------------- */
        privateInput.proof.verify();
        const update        = privateInput.proof.publicOutput.update;
        const preconditions = privateInput.proof.publicInput;

        /* ---------------------------------------------------- *
         * 2. Check pre-state invariants
         * ---------------------------------------------------- */
        const actualVaultParams = getActualVaultParams(state, update.collateralType);
        preconditions.vaultParameters.equals(actualVaultParams).assertTrue();

        preconditions.observerKeysMerkleRoot.assertEquals(
          state.zkUsdEnclavesState.observerKeysMerkleRoot,
        );

        /* ---------------------------------------------------- *
         * 3. Verify & apply the VaultMap update
         * ---------------------------------------------------- */
        const verifiedVaultUpdate = VaultMap.verifyDepositCollateralUpdate(
          privateInput.vaultMap,
          state.vaultState,
          update,
        );

        /* ---------------------------------------------------- *
         * 4. Verify & apply the CollateralIoMap update
         * ---------------------------------------------------- */
        const ioMap = privateInput.iomap;
        getRoot(ioMap).assertEquals(state.vaultState.collateralIoMapRoot);

        const verifiedIoUpdate = CollateralIoMap.verifyDeposit(ioMap, update);

        //   – update the IO map
        state.vaultState.collateralIoMapRoot =
          CollateralIoMap.verifiedUpdate(ioMap, verifiedIoUpdate);

        //   – update the Vault map
        state.vaultState.vaultMapRoot =
          VaultMap.verifiedUpdate(privateInput.vaultMap, verifiedVaultUpdate);

        /* ---------------------------------------------------- *
         * 5. Return commitment(rollupState_post)
         * ---------------------------------------------------- */
        return { publicOutput: getComputationStepOutput(state) };
      },
    },
  },
});

export class DepositCollateralComputationProof extends ZkProgram.Proof(
  DepositCollateralComputation,
) {}