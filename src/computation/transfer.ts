import { ZkProgram, Field, Struct, Poseidon }       from "o1js";
import { FizkRollupState }                          from "../domain/rollup-state.js";
import { TransferIntentProof }                      from "../intents/transfer.js";
import { ZkUsdMap }                                 from "../domain/zkusd/zkusd-map.js";
import { HistoricalBlockStateMap }                  from "../domain/block-info/historical-block-state-map.js";
import { getRoot }                                  from "../core/map/merkle-root.js";
import { ComputationStepOutput, getComputationStepOutput } from "./common.js";

export class TransferPrivateInput extends Struct({
  rollupState:            FizkRollupState,
  proof:                  TransferIntentProof,
  zkusdMap:               ZkUsdMap,
  historicalBlockStateMap: HistoricalBlockStateMap,
}) {}

export const TransferComputation = ZkProgram({
  name: "TransferComputation",
  publicInput:  Field,
  publicOutput: ComputationStepOutput,
  methods: {
    transfer: {
      privateInputs: [TransferPrivateInput],
      async method(
        publicInput: Field,
        priv: TransferPrivateInput & {
          proof: TransferIntentProof;
          zkusdMap: ZkUsdMap;
          historicalBlockStateMap: HistoricalBlockStateMap;
        },
      ): Promise<{ publicOutput: ComputationStepOutput }> {
        const state = priv.rollupState;
        Poseidon.hash(state.toFields()).assertEquals(publicInput);

        /* 1. verify proof */
        priv.proof.verify();

        /* 2. snapshot checks */
        const { noteSnapshotBlockNumber, noteSnapshotBlockHash } =
          priv.proof.publicInput;

        const hMap = priv.historicalBlockStateMap;
        getRoot(hMap).assertEquals(state.blockInfoState.historicalStateMerkleRoot);
        hMap.get(noteSnapshotBlockNumber.value).assertEquals(noteSnapshotBlockHash);
        noteSnapshotBlockNumber.assertLessThanOrEqual(
          state.blockInfoState.blockNumber,
        );

        /* 3. ZkUSD update */
        const newZkRoot = ZkUsdMap.verifyAndUpdate(
          priv.zkusdMap,
          state.zkUsdState,
          priv.proof.publicOutput.zkusdMapUpdate,
        );
        state.zkUsdState.zkUsdMapRoot = newZkRoot;

        return { publicOutput: getComputationStepOutput(state) };
      },
    },
  },
});

export class TransferComputationProof extends ZkProgram.Proof(
  TransferComputation,
) {}