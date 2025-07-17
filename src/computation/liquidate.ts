import { ZkProgram, Field, Struct, Poseidon, Provable } from "o1js";
import { FizkRollupState }                      from "../domain/rollup-state.js";
import { LiquidateIntentProof }                 from "../intents/liquidate.js";
import { ZkUsdMap }                             from "../domain/zkusd/zkusd-map.js";
import { VaultMap }                             from "../domain/vault/vault-map.js";
import { CollateralIoMap }                      from "../domain/bridging/collateral-io-map.js";
import { HistoricalBlockStateMap }              from "../domain/block-info/historical-block-state-map.js";
import { RedeemCollateralUpdate }               from "../domain/vault/vault-update.js";
import { CollateralType }                       from "../domain/vault/vault-collateral-type.js";
import { VaultParameters }                      from "../domain/vault/vault.js";
import { getRoot }                              from "../core/map/merkle-root.js";
import { ComputationStepOutput, getComputationStepOutput } from "./common.js";

/* helper */
function paramsOf(s: FizkRollupState, t: CollateralType): VaultParameters {
  return Provable.if(
    t.equals(CollateralType.SUI),
    s.vaultState.suiVaultTypeState.parameters,
    s.vaultState.minaVaultTypeState.parameters,
  );
}

export class LiquidatePrivateInput extends Struct({
  rollupState:            FizkRollupState,
  proof:                  LiquidateIntentProof,
  zkusdMap:               ZkUsdMap,
  vaultMap:               VaultMap,
  collateralIoMap:        CollateralIoMap,
  historicalBlockStateMap: HistoricalBlockStateMap,
}) {}

export const LiquidateComputation = ZkProgram({
  name: "LiquidateComputation",
  publicInput:  Field,
  publicOutput: ComputationStepOutput,
  methods: {
    liquidate: {
      privateInputs: [LiquidatePrivateInput],
      async method(
        publicInput: Field,
        priv: LiquidatePrivateInput & {
          proof: LiquidateIntentProof;
          zkusdMap: ZkUsdMap;
          vaultMap: VaultMap;
          collateralIoMap: CollateralIoMap;
          historicalBlockStateMap: HistoricalBlockStateMap;
        },
      ): Promise<{ publicOutput: ComputationStepOutput }> {
        const state = priv.rollupState;
        Poseidon.hash(state.toFields()).assertEquals(publicInput);

        /* 1. verify intent proof */
        priv.proof.verify();

        const pre   = priv.proof.publicInput;
        const vUpd  = priv.proof.publicOutput.vaultDebtRepayment;

        /* 2. params invariant */
        paramsOf(state, vUpd.collateralType).equals(pre.vaultParameters).assertTrue();

        /* 3. historical‑block validity */
        const hMap = priv.historicalBlockStateMap;
        getRoot(hMap).assertEquals(state.blockInfoState.historicalStateMerkleRoot);
        hMap.get(pre.noteSnapshotBlockNumber.value)
            .assertEquals(pre.noteSnapshotBlockHash);
        pre.noteSnapshotBlockNumber.assertLessThanOrEqual(
          state.blockInfoState.blockNumber,
        );

        /* 4. verify liquidation + get deltas */
        const { liquidateeCollateralDelta,
                liquidatorCollateralDelta,
                verifiedUpdate } = VaultMap.verifyLiquidationUpdate(
          priv.vaultMap,
          state.vaultState,
          vUpd,
        );

        /* 5. IO‑map updates (two withdrawals) */
        const ioMap = priv.collateralIoMap;
        const upd1  = CollateralIoMap.verifyWithdraw(
          ioMap,
          new RedeemCollateralUpdate({
            vaultAddress: vUpd.vaultAddress,
            collateralDelta: liquidateeCollateralDelta,
            collateralType:  vUpd.collateralType,
          }),
        );
        const upd2  = CollateralIoMap.verifyWithdraw(
          ioMap,
          new RedeemCollateralUpdate({
            vaultAddress: priv.proof.publicOutput.liquidatorVaultAddress,
            collateralDelta: liquidatorCollateralDelta,
            collateralType:  vUpd.collateralType,
          }),
        );

        /* 6. burn ZkUSD */
        const newZkRoot = ZkUsdMap.verifyAndUpdateSingleOutput(
          priv.zkusdMap,
          state.zkUsdState,
          priv.proof.publicOutput.zkusdBurnUpdate,
        );
        state.zkUsdState.zkUsdMapRoot = newZkRoot;

        /* 7. vault‑map root */
        state.vaultState.vaultMapRoot =
          VaultMap.verifiedUpdate(priv.vaultMap, verifiedUpdate);

        /* 8. apply both IO‑map roots */
        state.vaultState.collateralIoMapRoot =
          CollateralIoMap.verifiedUpdate(ioMap, upd1);
        state.vaultState.collateralIoMapRoot =
          CollateralIoMap.verifiedUpdate(ioMap, upd2);

        return { publicOutput: getComputationStepOutput(state) };
      },
    },
  },
});

export class LiquidateComputationProof extends ZkProgram.Proof(
  LiquidateComputation,
) {}