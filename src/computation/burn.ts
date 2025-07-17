import { ZkProgram, Field, Struct, Poseidon } from "o1js";
import { FizkRollupState }                         from "../domain/rollup-state.js";
import { BurnIntentProof }                         from "../intents/burn.js";
import { ZkUsdMap }                                from "../domain/zkusd/zkusd-map.js";
import { VaultMap }                                from "../domain/vault/vault-map.js";
import { HistoricalBlockStateMap }                 from "../domain/block-info/historical-block-state-map.js";
import { getRoot }                                 from "../core/map/merkle-root.js";
import { ComputationStepOutput, getActualVaultParams, getComputationStepOutput } from "./common.js";

export class BurnPrivateInput extends Struct({
  rollupState:            FizkRollupState,
  proof:                  BurnIntentProof,
  zkusdMap:               ZkUsdMap,
  vaultMap:               VaultMap,
  historicalBlockStateMap: HistoricalBlockStateMap,
}) {}


export const BurnComputation = ZkProgram({
  name: "BurnComputation",
  publicInput:  Field,
  publicOutput: ComputationStepOutput,
  methods: {
    burn: {
      privateInputs: [BurnPrivateInput],
      async method(
        publicInput: Field,
        priv: BurnPrivateInput & {
          proof: BurnIntentProof;
          zkusdMap: ZkUsdMap;
          vaultMap: VaultMap;
          historicalBlockStateMap: HistoricalBlockStateMap;
        },
      ): Promise<{ publicOutput: ComputationStepOutput }> {
        const state = priv.rollupState;
        Poseidon.hash(state.toFields()).assertEquals(publicInput);

        /* 1. Verify proof */
        priv.proof.verify();

        const pre   = priv.proof.publicInput;
        const vUpd  = priv.proof.publicOutput.vaultUpdate;

        /* 2. Vault‑parameter invariant */
        getActualVaultParams(state, vUpd.collateralType)
          .equals(pre.vaultParameters)
          .assertTrue();

        /* 3. Historical‑block validity */
        const hMap = priv.historicalBlockStateMap;
        getRoot(hMap).assertEquals(state.blockInfoState.historicalStateMerkleRoot);
        hMap.get(pre.noteSnapshotBlockNumber.value)
            .assertEquals(pre.noteSnapshotBlockHash);
        pre.noteSnapshotBlockNumber.assertLessThanOrEqual(
          state.blockInfoState.blockNumber,
        );

        /* 4. Verify Vault update */
        const verifiedVaultUpd = VaultMap.verifyRepayDebtUpdate(
          priv.vaultMap,
          state.vaultState,
          vUpd,
        );

        /* 5. Verify & apply ZkUSD update */
        const newZkRoot = ZkUsdMap.verifyAndUpdate(
          priv.zkusdMap,
          state.zkUsdState,
          priv.proof.publicOutput.zkusdMapUpdate,
        );
        state.zkUsdState.zkUsdMapRoot = newZkRoot;

        /* 6. Apply Vault‑map change */
        state.vaultState.vaultMapRoot =
          VaultMap.verifiedUpdate(priv.vaultMap, verifiedVaultUpd);

        /* 7. Return commitment */
        return { publicOutput: getComputationStepOutput(state) };
      },
    },
  },
});

export class BurnComputationProof extends ZkProgram.Proof(BurnComputation) {}