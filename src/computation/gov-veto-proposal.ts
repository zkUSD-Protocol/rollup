import { ZkProgram, Field, Struct, Poseidon }        from "o1js";
import { FizkRollupState }                       from "../domain/rollup-state.js";
import { GovActionIntentProof }                  from "../intents/governance/wrapper.js";
import {
  proposalInclusionCommitmentForStatus,
  GovActionType,
  GovProposalStatus,
} from "../intents/governance/wrapper.js";
import { ProposalMap }                           from "../domain/governance/proposal-map.js";
import { HistoricalBlockStateMap }               from "../domain/block-info/historical-block-state-map.js";
import { getRoot }                               from "../core/map/merkle-root.js";
import { verifySnapshotOlderBy } from "./gov-common.js";
import { ComputationStepOutput, getComputationStepOutput } from "./common.js";

export class GovVetoPrivateInput extends Struct({
  rollupState:           FizkRollupState,
  proof:                 GovActionIntentProof,
  liveProposalMap:       ProposalMap,
  proposalSnapshotState: FizkRollupState,
  historicalBlockStateMap: HistoricalBlockStateMap,
}) {}

export const GovVetoProposalComputation = ZkProgram({
  name: "GovVetoProposalComputation",
  publicInput:  Field,
  publicOutput: ComputationStepOutput,
  methods: {
    govVetoProposal: {
      privateInputs: [GovVetoPrivateInput],
      async method(
        publicInput: Field,
        priv: GovVetoPrivateInput & {
          proof: GovActionIntentProof;
          liveProposalMap: ProposalMap;
          proposalSnapshotState: FizkRollupState;
          historicalBlockStateMap: HistoricalBlockStateMap;
        },
      ): Promise<{ publicOutput: ComputationStepOutput }> {
        const state = priv.rollupState;
        Poseidon.hash(state.toFields()).assertEquals(publicInput);

        priv.proof.verify();
        priv.proof.publicOutput.govActionType.assertEquals(
          GovActionType.vetoProposal,
        );

        verifySnapshotOlderBy(
          state.blockInfoState,
          priv.historicalBlockStateMap,
          priv.proposalSnapshotState,
          state.governanceState.proposalSnapshotValidityMillis,
        );

        state.governanceState.proposalMapRoot.assertEquals(
          getRoot(priv.liveProposalMap),
        );

        const idx = priv.proof.publicOutput.proposalIndex;
        const inclBlock = priv.proof.publicOutput.proposalInclusionBlockInfo;

        /* pending commitment must exist */
        const pending = proposalInclusionCommitmentForStatus(
          priv.proof.publicOutput.proposal,
          idx,
          inclBlock,
          GovProposalStatus.pending,
        );
        priv.liveProposalMap.get(idx).assertEquals(pending);

        /* swap to vetoed */
        const vetoed = proposalInclusionCommitmentForStatus(
          priv.proof.publicOutput.proposal,
          idx,
          inclBlock,
          GovProposalStatus.vetoed,
        );
        priv.liveProposalMap.update(idx, vetoed);
        state.governanceState.proposalMapRoot = getRoot(priv.liveProposalMap);

        return { publicOutput: getComputationStepOutput(state) };
      },
    },
  },
});

export class GovVetoProposalComputationProof extends ZkProgram.Proof(
  GovVetoProposalComputation,
) {}