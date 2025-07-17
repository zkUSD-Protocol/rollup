import { ZkProgram, Field, Struct, Poseidon, Provable } from "o1js";
import { FizkRollupState }                         from "../domain/rollup-state.js";
import { MintIntentProof }                         from "../intents/mint.js";
import { VaultMap }                                from "../domain/vault/vault-map.js";
import { ZkUsdMap }                                from "../domain/zkusd/zkusd-map.js";
import { HistoricalBlockStateMap }                 from "../domain/block-info/historical-block-state-map.js";
import { CollateralType }                          from "../domain/vault/vault-collateral-type.js";
import { ComputationStepOutput, getComputationStepOutput } from "./common.js";

export class MintPrivateInput extends Struct({
  rollupState:            FizkRollupState,
  proof:                  MintIntentProof,
  zkusdMap:               ZkUsdMap,
  vaultMap:               VaultMap,
  historicalBlockStateMap: HistoricalBlockStateMap,
}) {}

export const MintComputation = ZkProgram({
  name: "MintComputation",
  publicInput:  Field,
  publicOutput: ComputationStepOutput,
  methods: {
    mint: {
      privateInputs: [MintPrivateInput],
      async method(
        publicInput: Field,
        priv: MintPrivateInput & {
          proof: MintIntentProof;
          zkusdMap: ZkUsdMap;
          vaultMap: VaultMap;
          historicalBlockStateMap: HistoricalBlockStateMap;
        },
      ): Promise<{ publicOutput: ComputationStepOutput }> {
        const state = priv.rollupState;
        Poseidon.hash(state.toFields()).assertEquals(publicInput);

        /* 1. Verify proof */
        priv.proof.verify();

        const vUpd = priv.proof.publicOutput.vaultUpdate;

        /* 2. Check price/timestamp consistency */
        const currBlock  = state.blockInfoState.blockNumber;
        const priceBlock = priv.proof.publicInput.rollupStateBlockNumber;

        const collateralPrice = Provable.if(
          vUpd.collateralType.equals(CollateralType.SUI),
          state.vaultState.suiVaultTypeState.priceNanoUsd,
          state.vaultState.minaVaultTypeState.priceNanoUsd,
        );

        const currentStateCond = currBlock.equals(priceBlock)
          .and(priv.proof.publicInput.collateralPriceNanoUsd.equals(collateralPrice));

        const hMap = priv.historicalBlockStateMap;
        const prevHash = hMap.get(priceBlock.value);

        const previousStateCond = currBlock.sub(1).equals(priceBlock).and(
          prevHash.equals(priv.proof.publicInput.rollupStateHash),
        );

        currentStateCond.or(previousStateCond).assertTrue();

        /* 3. Verify & apply Vault update */
        const verifiedVaultUpd = VaultMap.verifyMintUpdate(
          priv.vaultMap,
          state.vaultState,
          vUpd,
        );

        /* 4. ZkUSD map update */
        const newZkRoot = ZkUsdMap.verifyAndUpdate(
          priv.zkusdMap,
          state.zkUsdState,
          priv.proof.publicOutput.zkusdMapUpdate,
        );
        state.zkUsdState.zkUsdMapRoot = newZkRoot;

        /* 5. Vault map root update */
        state.vaultState.vaultMapRoot =
          VaultMap.verifiedUpdate(priv.vaultMap, verifiedVaultUpd);

        /* 6. Return commitment */
        return { publicOutput: getComputationStepOutput(state) };
      },
    },
  },
});

export class MintComputationProof extends ZkProgram.Proof(MintComputation) {}