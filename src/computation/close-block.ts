import { ZkProgram, Field, Struct, Poseidon }     from "o1js";
import { FizkRollupState }                    from "../domain/rollup-state.js";
import { BlockCloseIntentProof, OracleBlockDataProof }              from "../intents/block-close-intent.js";  // assuming proof export
import { HistoricalBlockStateMap }            from "../domain/block-info/historical-block-state-map.js";
import { Timestamp }                          from "../core/timestamp.js";
import { BlockInfoState } from "../domain/block-info/block-info-state.js";
import { ComputationStepOutput, getComputationStepOutput } from "./common.js";

function updateBlockInfo(
  hMap: HistoricalBlockStateMap,
  ts: Timestamp,
  info: BlockInfoState,
  prevHash: Field,
) {
  info.blockNumber = info.blockNumber.add(1);
  info.previousBlockClosureTimestamp = ts;
  info.intentSequence = info.intentSequence.add(1);
  hMap.insert(info.blockNumber.sub(1).value, prevHash);
}

export class BlockClosePrivateInput extends Struct({
  rollupState:        FizkRollupState,
  oracleBlockDataProof: OracleBlockDataProof,
  historicalStateMap: HistoricalBlockStateMap,
}) {}

export const BlockCloseComputation = ZkProgram({
  name: "BlockCloseComputation",
  publicInput:  Field,
  publicOutput: ComputationStepOutput,
  methods: {
    blockCloseIntent: {
      privateInputs: [BlockClosePrivateInput],
      async method(
        publicInput: Field,
        priv: BlockClosePrivateInput & {
          oracleBlockDataProof: BlockCloseIntentProof;
          historicalStateMap:   HistoricalBlockStateMap;
        },
      ): Promise<{ publicOutput: ComputationStepOutput }> {
        /* 0. pre‑state commitment */
        const state = priv.rollupState;
        const prevHash = Poseidon.hash(state.toFields());
        prevHash.assertEquals(publicInput);

        /* 1. verify oracle proof */
        priv.oracleBlockDataProof.verify();

        /* 2. apply vault‑type price & rate updates */
        state.vaultState.minaVaultTypeState.priceNanoUsd =
          priv.oracleBlockDataProof.publicOutput
              .minaVaultTypeUpdate.priceNanoUsd;
        state.vaultState.minaVaultTypeState
            .globalAccumulativeInterestRateScaled =
          priv.oracleBlockDataProof.publicOutput
              .minaVaultTypeUpdate.blockRateScaledUpdate;

        state.vaultState.suiVaultTypeState.priceNanoUsd =
          priv.oracleBlockDataProof.publicOutput
              .suiVaultTypeUpdate.priceNanoUsd;
        state.vaultState.suiVaultTypeState
            .globalAccumulativeInterestRateScaled =
          priv.oracleBlockDataProof.publicOutput
              .suiVaultTypeUpdate.blockRateScaledUpdate;

        /* 3. roll‑forward blockInfoState */
        updateBlockInfo(
          priv.historicalStateMap,
          priv.oracleBlockDataProof.publicOutput.timestamp,
          state.blockInfoState,
          prevHash,
        );

        /* 4. return new state commitment */
        return { publicOutput: getComputationStepOutput(state) };
      },
    },
  },
});

export class BlockCloseComputationProof extends ZkProgram.Proof(
  BlockCloseComputation,
) {}