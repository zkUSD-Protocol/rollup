import { ZkProgram, Field, Struct, Poseidon } from "o1js";
import { FizkRollupState }                      from "../domain/rollup-state.js";
import { GovActionIntentProof }                 from "../intents/governance/wrapper.js";
import {
  proposalInclusionCommitmentForStatus,
  GovProposalStatus,
} from "../intents/governance/wrapper.js";
import { ProposalMap }                          from "../domain/governance/proposal-map.js";
import { HistoricalBlockStateMap }              from "../domain/block-info/historical-block-state-map.js";
import { getRoot }                              from "../core/map/merkle-root.js";
import { verifySnapshotOlderBy } from "./gov-common.js";
import { ComputationStepOutput, getComputationStepOutput } from "./common.js";

export class GovCreateProposalPrivateInput extends Struct({
  rollupState:           FizkRollupState,
  proof:                 GovActionIntentProof,
  liveProposalMap:       ProposalMap,
  proposalSnapshotState: FizkRollupState,
  historicalBlockStateMap: HistoricalBlockStateMap,
}) {}

export const GovCreateProposalComputation = ZkProgram({
  name: "GovCreateProposalComputation",
  publicInput:  Field,
  publicOutput: ComputationStepOutput,
  methods: {
    govCreateProposal: {
      privateInputs: [GovCreateProposalPrivateInput],
      async method(
        publicInput: Field,
        priv: GovCreateProposalPrivateInput & {
          proof: GovActionIntentProof;
          liveProposalMap: ProposalMap;
          proposalSnapshotState: FizkRollupState;
          historicalBlockStateMap: HistoricalBlockStateMap;
        },
      ): Promise<{ publicOutput: ComputationStepOutput }> {
        const state = priv.rollupState;
        Poseidon.hash(state.toFields()).assertEquals(publicInput);

        /* 1. verify proof */
        priv.proof.verify();

        /* 2. snapshot verification */
        verifySnapshotOlderBy(
          state.blockInfoState,
          priv.historicalBlockStateMap,
          priv.proposalSnapshotState,
          state.governanceState.proposalSnapshotValidityMillis,
        );

        /* 3. proposal map root matches */
        state.governanceState.proposalMapRoot.assertEquals(
          getRoot(priv.liveProposalMap),
        );

        /* 4. insert new pending proposal */
        const idx = state.governanceState.lastProposalIndex.add(1);
        state.governanceState.lastProposalIndex = idx;

        const pendingCommit = proposalInclusionCommitmentForStatus(
          priv.proof.publicOutput.proposal,
          idx,
          state.blockInfoState,
          GovProposalStatus.pending,
        );

        priv.liveProposalMap.insert(idx, pendingCommit);
        state.governanceState.proposalMapRoot = getRoot(priv.liveProposalMap);

        return { publicOutput: getComputationStepOutput(state) };
      },
    },
  },
});

export class GovCreateProposalComputationProof extends ZkProgram.Proof(
  GovCreateProposalComputation,
) {}