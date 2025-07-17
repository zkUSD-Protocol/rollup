import { Provable, ZkProgram, Field, Struct, Poseidon }       from "o1js";
import { FizkRollupState }                      from "../domain/rollup-state.js";
import { GovActionIntentProof }                 from "../intents/governance/wrapper.js";
import {
  proposalInclusionCommitmentForStatus,
  GovActionType,
  GovProposalStatus,
  GovSystemUpdate,
} from "../intents/governance/wrapper.js";
import { ProposalMap }                          from "../domain/governance/proposal-map.js";
import { getRoot }                              from "../core/map/merkle-root.js";
import { ComputationStepOutput, getComputationStepOutput } from "./common.js";

function applyGovernanceUpdates(
  rollupState: FizkRollupState,
  govUpdate: GovSystemUpdate,
): void {
  rollupState.vaultState.minaVaultTypeState.parameters = Provable.if(
    govUpdate.applyMinaVaultParamsUpdate,
    govUpdate.minaVaultParamsUpdate,
    rollupState.vaultState.minaVaultTypeState.parameters,
  );

  rollupState.vaultState.suiVaultTypeState.parameters = Provable.if(
    govUpdate.applySuiVaultParamsUpdate,
    govUpdate.suiVaultParamsUpdate,
    rollupState.vaultState.suiVaultTypeState.parameters,
  );

  rollupState.zkUsdEnclavesState = Provable.if(
    govUpdate.applyEnclaveStateUpdate,
    govUpdate.enclaveStateUpdate,
    rollupState.zkUsdEnclavesState,
  );

  rollupState.globalParametersState = Provable.if(
    govUpdate.applyGlobalParametersStateUpdate,
    govUpdate.globalParametersStateUpdate,
    rollupState.globalParametersState,
  );

  rollupState.governanceState = Provable.if(
    govUpdate.applyGovernanceStateUpdate,
    rollupState.governanceState.applyUpdate(govUpdate.governanceStateUpdate),
    rollupState.governanceState,
  );

  rollupState.regulatoryState = Provable.if(
    govUpdate.applyRegulatoryStateUpdate,
    govUpdate.regulatoryStateUpdate,
    rollupState.regulatoryState,
  );
}

export class GovExecutePrivateInput extends Struct({
  rollupState:     FizkRollupState,
  proof:           GovActionIntentProof,
  liveProposalMap: ProposalMap,
}) {}

export const GovExecuteUpdateComputation = ZkProgram({
  name: "GovExecuteUpdateComputation",
  publicInput:  Field,
  publicOutput: ComputationStepOutput,
  methods: {
    govExecuteUpdateIntent: {
      privateInputs: [GovExecutePrivateInput],
      async method(
        publicInput: Field,
        priv: GovExecutePrivateInput & {
          proof: GovActionIntentProof;
          liveProposalMap: ProposalMap;
        },
      ): Promise<{ publicOutput: ComputationStepOutput }> {
        const state = priv.rollupState;
        Poseidon.hash(state.toFields()).assertEquals(publicInput);

        /* verify proof & action type */
        priv.proof.verify();
        priv.proof.publicOutput.govActionType.assertEquals(
          GovActionType.executeUpdate,
        );

        /* map root matches */
        getRoot(priv.liveProposalMap).assertEquals(
          state.governanceState.proposalMapRoot,
        );

        /* execution delay satisfied */
        const creationTs =
          priv.proof.publicOutput.proposalInclusionBlockInfo
              .previousBlockClosureTimestamp;
        const nowTs = state.blockInfoState.previousBlockClosureTimestamp;
        creationTs.isGreaterThanBy(
          nowTs,
          state.governanceState.proposalExecutionDelayMillis,
        );

        /* pending commitment must exist */
        const idx = priv.proof.publicOutput.proposalIndex;
        const inclBlock = priv.proof.publicOutput.proposalInclusionBlockInfo;
        const pending = proposalInclusionCommitmentForStatus(
          priv.proof.publicOutput.proposal,
          idx,
          inclBlock,
          GovProposalStatus.pending,
        );
        priv.liveProposalMap.get(idx).assertEquals(pending);

        /* apply system update */
        applyGovernanceUpdates(state, priv.proof.publicOutput.govSystemUpdate as GovSystemUpdate);

        /* mark executed */
        const executed = proposalInclusionCommitmentForStatus(
          priv.proof.publicOutput.proposal,
          idx,
          inclBlock,
          GovProposalStatus.executed,
        );
        priv.liveProposalMap.update(idx, executed);
        state.governanceState.proposalMapRoot = getRoot(priv.liveProposalMap);

        return { publicOutput: getComputationStepOutput(state) };
      },
    },
  },
});

export class GovExecuteUpdateComputationProof extends ZkProgram.Proof(
  GovExecuteUpdateComputation,
) {}