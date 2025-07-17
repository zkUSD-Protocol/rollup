import { ZkProgram, Field, Struct, Poseidon }       from "o1js";
import { FizkRollupState }                          from "../domain/rollup-state.js";
import { BridgeInIntentOutput, BridgeInIntentProof }                      from "../intents/bridge-in.js";
import { ZkUsdMap }                                 from "../domain/zkusd/zkusd-map.js";
import { BridgeIoMap }                              from "../domain/bridging/bridge-io-map.js";
import { ObserverMap }                              from "../domain/enclave/observer-map.js";
import { getRoot }                                  from "../core/map/merkle-root.js";
import { ComputationStepOutput, getComputationStepOutput } from "./common.js";

export class BridgeInPrivateInput extends Struct({
  rollupState:  FizkRollupState,
  proof:        BridgeInIntentProof,
  zkusdMap:     ZkUsdMap,
  bridgeIoMap:  BridgeIoMap,
  observerMap:  ObserverMap,
}) {}



export const BridgeInComputation = ZkProgram({
  name: "BridgeInComputation",
  publicInput:  Field,
  publicOutput: ComputationStepOutput,
  methods: {
    bridgeIn: {
      privateInputs: [BridgeInPrivateInput],
      async method(
        publicInput: Field,
        priv: BridgeInPrivateInput & {
          proof:       BridgeInIntentProof;
          zkusdMap:    ZkUsdMap;
          bridgeIoMap: BridgeIoMap;
          observerMap: ObserverMap;
        },
      ): Promise<{ publicOutput: ComputationStepOutput }> {
        /* 0. Pre‑state commitment */
        const state = priv.rollupState;
        Poseidon.hash(state.toFields()).assertEquals(publicInput);

        /* 1. Verify intent proof */
        priv.proof.verify();

        /* 2. Observer threshold */
        priv.proof.publicOutput.observersSignedCount.assertGreaterThanOrEqual(
          state.governanceState.observersMultiSigTreshold,
        );

        /* 3. Merkle‑roots must match the pre‑state */
        getRoot(priv.zkusdMap).assertEquals(state.zkUsdState.zkUsdMapRoot);
        getRoot(priv.bridgeIoMap).assertEquals(state.zkUsdState.bridgeIoMapRoot);

        /* 4. Observer map root in preconditions */
        state.zkUsdEnclavesState.observerKeysMerkleRoot.assertEquals(
          priv.proof.publicInput.observerMapRoot,
        );

        /* 5. Accumulator consistency */
        const bridgedAddr   = priv.proof.publicOutput.bridgeIntentUpdate.bridgedAddress;
        const actualAccums  = BridgeIoMap.getAccumulators(priv.bridgeIoMap, bridgedAddr);
        actualAccums.totalMinted.assertEquals(
          priv.proof.publicInput.totalAmountBridgedIn,
        );

        /* 6. Verify IO‑map receive update */
        const verifiedIoUp = BridgeIoMap.verifyBridgeReceiveIntent(
          priv.bridgeIoMap,
          priv.proof.publicOutput.bridgeIntentUpdate,
        );

        /* 7. Apply ZkUSD update */
        const newZkRoot = ZkUsdMap.verifyAndUpdate(
          priv.zkusdMap,
          state.zkUsdState,
          priv.proof.publicOutput.zkusdMapUpdate,
        );
        state.zkUsdState.zkUsdMapRoot = newZkRoot;

        /* 8. Apply BridgeIoMap root update */
        state.zkUsdState.bridgeIoMapRoot =
          BridgeIoMap.verifiedSet(priv.bridgeIoMap, verifiedIoUp);

        return { publicOutput: getComputationStepOutput(state) };
      },
    },
  },
});

export class BridgeInComputationProof extends ZkProgram.Proof(
  BridgeInComputation,
) {}