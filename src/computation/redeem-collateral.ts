import { ZkProgram, Field, Struct, Poseidon, Provable } from "o1js";
import { FizkRollupState }                         from "../domain/rollup-state.js";
import { RedeemIntentProof }                       from "../intents/redeem.js";
import { VaultMap }                                from "../domain/vault/vault-map.js";
import { CollateralIoMap }                         from "../domain/bridging/collateral-io-map.js";
import { getRoot }                                 from "../core/map/merkle-root.js";
import { getActualVaultParams, ComputationStepOutput, getComputationStepOutput } from "./common.js";

/* -------------------------------------------------- */
/* Private input                                      */
/* -------------------------------------------------- */
export class RedeemCollateralPrivateInput extends Struct({
  rollupState: FizkRollupState,
  proof:       RedeemIntentProof,
  vaultMap:    VaultMap,
  iomap:       CollateralIoMap,
}) {}

/* -------------------------------------------------- */
/* Computation circuit                                */
/* -------------------------------------------------- */
export const RedeemCollateralComputation = ZkProgram({
  name: "RedeemCollateralComputation",
  publicInput:  Field,
  publicOutput: ComputationStepOutput,
  methods: {
    redeemCollateral: {
      privateInputs: [RedeemCollateralPrivateInput],
      async method(
        publicInput: Field,
        priv: RedeemCollateralPrivateInput & {
          proof:    RedeemIntentProof;
          vaultMap: VaultMap;
          iomap:    CollateralIoMap;
        },
      ): Promise<{ publicOutput: ComputationStepOutput }> {
        /* 0. Pre‑state commitment check */
        const state = priv.rollupState;
        Poseidon.hash(state.toFields()).assertEquals(publicInput);

        /* 1. Verify intent proof */
        priv.proof.verify();

        const update        = priv.proof.publicOutput.update;
        const preconditions = priv.proof.publicInput;

        /* 2. Pre‑state invariants */
        const actualVaultParams = getActualVaultParams(state, update.collateralType);
        preconditions.vaultParameters.equals(actualVaultParams).assertTrue();

        /* IO‑map root must match */
        const ioMap = priv.iomap;
        getRoot(ioMap).assertEquals(state.vaultState.collateralIoMapRoot);

        /* 3. Verify & apply Vault update */
        const verifiedVaultUpdate = VaultMap.verifyRedeemCollateralUpdate(
          priv.vaultMap,
          state.vaultState,
          update,
        );

        /* 4. Verify & apply IO update */
        const verifiedIoUpdate = CollateralIoMap.verifyWithdraw(ioMap, update);
        state.vaultState.collateralIoMapRoot =
          CollateralIoMap.verifiedUpdate(ioMap, verifiedIoUpdate);

        /* 5. Apply Vault map update */
        state.vaultState.vaultMapRoot =
          VaultMap.verifiedUpdate(priv.vaultMap, verifiedVaultUpdate);

        /* 6. Return post‑state commitment */
        return { publicOutput: getComputationStepOutput(state) };
      },
    },
  },
});

/* -------------------------------------------------- */
/* Proof type exported for the roll‑up                */
/* -------------------------------------------------- */
export class RedeemCollateralComputationProof extends ZkProgram.Proof(
  RedeemCollateralComputation,
) {}