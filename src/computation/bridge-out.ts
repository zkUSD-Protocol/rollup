import { ZkProgram, Field, Struct, Poseidon }      from "o1js";
import { FizkRollupState }                         from "../domain/rollup-state.js";
import { BridgeOutIntentProof }                       from "../intents/bridge-out.js";
import { HistoricalBlockStateMap }                 from "../domain/block-info/historical-block-state-map.js";
import { BridgeMap }                               from "../domain/bridging/bridge-map.js";
import { BridgeIoMap }                             from "../domain/bridging/bridge-io-map.js";
import { ZkUsdMap }                                from "../domain/zkusd/zkusd-map.js";
import { getRoot }                                 from "../core/map/merkle-root.js";
import { ComputationStepOutput, getComputationStepOutput } from "./common.js";

export class BridgeOutPrivateInput extends Struct({
  rollupState:            FizkRollupState,
  proof:                  BridgeOutIntentProof,
  zkusdMap:               ZkUsdMap,
  bridgeIoMap:            BridgeIoMap,
  bridgeMap:              BridgeMap,
  historicalBlockStateMap: HistoricalBlockStateMap,
}) {}

/* -------------------------------------------------- */
/* Computation circuit                                */
/* -------------------------------------------------- */
export const BridgeOutComputation = ZkProgram({
  name: "BridgeOutComputation",
  publicInput:  Field,
  publicOutput: ComputationStepOutput,
  methods: {
    bridgeOut: {
      privateInputs: [BridgeOutPrivateInput],
      async method(
        publicInput: Field,
        priv: BridgeOutPrivateInput & {
          proof: BridgeOutIntentProof;
          zkusdMap: ZkUsdMap;
          bridgeIoMap: BridgeIoMap;
          bridgeMap: BridgeMap;
          historicalBlockStateMap: HistoricalBlockStateMap;
        },
      ): Promise<{ publicOutput: ComputationStepOutput }> {
        /* 0. Commitment check */
        const state = priv.rollupState;
        Poseidon.hash(state.toFields()).assertEquals(publicInput);

        /* 1. Verify intent proof */
        priv.proof.verify();
        const proofOut = priv.proof.publicOutput;
        const pre      = priv.proof.publicInput;

        /* 2. Historical‑block checks */
        const hMap = priv.historicalBlockStateMap;
        getRoot(hMap).assertEquals(state.blockInfoState.historicalStateMerkleRoot);

        hMap.get(pre.noteSnapshotBlockNumber.value)
            .assertEquals(pre.noteSnapshotBlockHash);

        pre.noteSnapshotBlockNumber.assertLessThanOrEqual(
          state.blockInfoState.blockNumber,
        );

        /* 3. Ensure BridgeMap root matches roll‑up state */
        getRoot(priv.bridgeMap).assertEquals(state.zkUsdState.bridgeIoMapRoot);

        /* 4. Verify & apply BridgeIoMap update */
        const verifiedIoUpdate = BridgeIoMap.verifyBridgeSendIntent(
          priv.bridgeIoMap,
          proofOut.bridgeIntentUpdate,
        );

        /* 5. Verify & apply ZkUsd map update */
        const newZkusdRoot = ZkUsdMap.verifyAndUpdate(
          priv.zkusdMap,
          state.zkUsdState,
          proofOut.zkusdMapUpdate,
        );
        state.zkUsdState.zkUsdMapRoot = newZkusdRoot;

        /* 6. Apply BridgeIoMap root update */
        state.zkUsdState.bridgeIoMapRoot =
          BridgeIoMap.verifiedSet(priv.bridgeIoMap, verifiedIoUpdate);

        /* 7. Return commitment(post‑state) */
        return { publicOutput: getComputationStepOutput(state) };
      },
    },
  },
});

/* -------------------------------------------------- */
/* Proof wrapper                                      */
/* -------------------------------------------------- */
export class BridgeOutComputationProof extends ZkProgram.Proof(
  BridgeOutComputation,
) {}