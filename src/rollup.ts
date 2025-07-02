import { Field, Poseidon, Provable, Struct, UInt64, ZkProgram } from "o1js";
import { FizkRollupState } from "./domain/rollup-state.js";
import { BlockCloseIntentPrivateInput } from "./intents/block-close-intent.js";
import { HistoricalBlockStateMap } from "./domain/block-info/historical-block-state-map.js";
import { BlockInfoState } from "./domain/block-info/block-info-state.js";
import { proposalInclusionCommitmentForStatus, GovActionType, GovProposalStatus, GovActionIntentProof } from "./intents/governance/wrapper.js";
import { Timestamp } from "./core/timestamp.js";
import { ProposalMap } from "./domain/governance/proposal-map.js";
import { StakeMap } from "./domain/governance/stake-map.js";

/**
 * Copies live roots to intent roots for all state maps in the rollup state
 * @param state The rollup state to update
 */
function copyLiveRootsToIntentRoots(state: FizkRollupState): void {
  // Copy vault state roots
  state.vaultState.vaultMapRoot.intentRoot.root = state.vaultState.vaultMapRoot.liveRoot.root;
  state.vaultState.ioMapRoot.intentRoot.root = state.vaultState.ioMapRoot.liveRoot.root;
  
  // Copy zkUSD state roots
  state.zkUsdState.zkUsdMapRoot.intentRoot.root = state.zkUsdState.zkUsdMapRoot.liveRoot.root;
  state.zkUsdState.ioMapRoot.intentRoot.root = state.zkUsdState.ioMapRoot.liveRoot.root;
  
  // Copy fizk token state roots
  state.fizkTokenState.fizkTokenMapRoot.intentRoot.root = state.fizkTokenState.fizkTokenMapRoot.liveRoot.root;
  state.fizkTokenState.ioMapRoot.intentRoot.root = state.fizkTokenState.ioMapRoot.liveRoot.root;
  
  // Copy governance state roots
  state.governanceState.proposalMapRoot.intentRoot.root = state.governanceState.proposalMapRoot.liveRoot.root;
  state.governanceState.stakeMapRoot.intentRoot.root = state.governanceState.stakeMapRoot.liveRoot.root;
}

/**
 * Updates the block info state with new block information and stores the previous state hash
 * @param historicalStateTree The historical state tree to update
 * @param timestamp The timestamp of the block
 * @param blockInfoState The block info state to update
 * @param previousStateHash The hash of the previous state
 * @returns The updated block info state
 */
function updateBlockInfoState(
  historicalStateTree: HistoricalBlockStateMap,
  timestamp: Timestamp,
  blockInfoState: BlockInfoState,
  previousStateHash: Field,
): void {
  // Increment block number
  blockInfoState.blockNumber = blockInfoState.blockNumber.add(1);
  
  // TODO: Extract timestamp from the proof
  blockInfoState.previousBlockClosureTimestamp = timestamp;
  
  // TODO: Find the intent sequence
  blockInfoState.intentSequence = blockInfoState.intentSequence.add(1);
  
  // Store the previous state hash in the historical state tree
  historicalStateTree.insert(blockInfoState.blockNumber.sub(1).value, previousStateHash);
}

// the private input for the rollup level of the govactionintent

export class GovExecuteUpdatePrivateInput extends Struct({
	proof: GovActionIntentProof,
	liveProposalMap: ProposalMap,
}) {}

export class GovCreateProposalPrivateInput extends Struct({
	proof: GovActionIntentProof,
	liveProposalMap: ProposalMap,
	proposalSnapshotState: FizkRollupState,
	historicalBlockStateMap: HistoricalBlockStateMap,
}) {}



export const ZkusdRollup = ZkProgram({
  name: 'ZkusdRollup',
  publicInput: FizkRollupState,
  publicOutput: FizkRollupState,
  methods: {
	govCreateProposal: {
		privateInputs: [GovCreateProposalPrivateInput],
		async method(
			publicInput: FizkRollupState,
			privateInput: GovCreateProposalPrivateInput): Promise<{ publicOutput: FizkRollupState }> {

		    // this should verify that enough stake voted for creation of this update
		    // or that the council has signed it
			// the stake root is later checked against the snapshot stake map
			privateInput.proof.verify();

			// == verify the stake map used in the proof.
			// private input map matches the current state's historical state map root
			privateInput.historicalBlockStateMap.root.assertEquals(publicInput.blockInfoState.historicalStateMerkleRoot.root);
			const snapshotState = privateInput.proposalSnapshotState;
			// the snapshot must exist within history within threshold
			const snapshotHash = Poseidon.hash(snapshotState.toFields());
			privateInput.historicalBlockStateMap.get(snapshotState.blockInfoState.blockNumber.value).assertEquals(snapshotHash);
			// now we know that the snapshot hash is actually the root of the historical block state map
			// lets verify that the state matches the hash
			Poseidon.hash(snapshotState.toFields()).assertEquals(snapshotHash);
			// now we know that the snapshot state is actually one of the hitorical states
			// check if it is not too old
			const currentBlockInfo = publicInput.blockInfoState;
			const snapshotTimestamp = snapshotState.blockInfoState.previousBlockClosureTimestamp;
			const currentTimestamp = currentBlockInfo.previousBlockClosureTimestamp;
			currentTimestamp.isGreaterBy(snapshotTimestamp, publicInput.governanceState.proposalSnapshotValidityMillis).assertFalse();
			// it is not too old, now check if the stake map provided matches the historical state map

			// proposal map must be up-to-date
			publicInput.governanceState.proposalMapRoot.liveRoot.root.assertEquals(privateInput.liveProposalMap.root);

			// get the current proposal index
			const proposalIndex = publicInput.governanceState.lastProposalIndex.add(1);
			// update the current proposal index
			publicInput.governanceState.lastProposalIndex = proposalIndex;

			// create proposal commitment for the current block
			const pendingProposalCommitment = proposalInclusionCommitmentForStatus(privateInput.proof.publicOutput.proposal, proposalIndex, currentBlockInfo, GovProposalStatus.pending);
			privateInput.liveProposalMap.insert(proposalIndex, pendingProposalCommitment);

			// update the proposal map root
			publicInput.governanceState.proposalMapRoot.liveRoot.root = privateInput.liveProposalMap.root;

			return { publicOutput: publicInput }
		}
	},
	govExecuteUpdateIntent: {
		privateInputs: [GovExecuteUpdatePrivateInput],
		async method(
			publicInput: FizkRollupState,
			privateInput: GovExecuteUpdatePrivateInput): Promise<{ publicOutput: FizkRollupState }> {

				// verify the update proof
				privateInput.proof.verify();

				// assert it's an execution
				privateInput.proof.publicOutput.govActionType.assertEquals(GovActionType.executeUpdate);
				
				// the proposal live map root must be the same 
				// which means one gov update per block.
				publicInput.governanceState.proposalMapRoot.liveRoot.assertEquals(privateInput.proof.publicInput.proposalMapRoot);

				// proposal map must be up-to-date
				publicInput.governanceState.proposalMapRoot.liveRoot.root.assertEquals(privateInput.liveProposalMap.root);

				// the proposal can be executed against the map
				// verify the creation timestamp is bigger than the required delay
				const proposalCreationTimestamp = privateInput.proof.publicOutput.proposalInclusionBlockInfo.previousBlockClosureTimestamp;
				const currentTimestamp = publicInput.blockInfoState.previousBlockClosureTimestamp;
				proposalCreationTimestamp.isGreaterBy(currentTimestamp, publicInput.governanceState.proposalExecutionDelayMillis);

				// get the proposal commitment and check against the map
				const proposalCommitment = proposalInclusionCommitmentForStatus(privateInput.proof.publicOutput.proposal, privateInput.proof.publicOutput.proposalIndex, privateInput.proof.publicOutput.proposalInclusionBlockInfo, GovProposalStatus.pending);
				privateInput.liveProposalMap.get(privateInput.proof.publicOutput.proposalIndex).assertEquals(proposalCommitment);
				
				// the update is verified at this point - apply
				const govUpdate = privateInput.proof.publicOutput.govSystemUpdate;
				
				
				publicInput.vaultState.minaVaultTypeState.parameters = Provable.if(
					govUpdate.applyMinaVaultParamsUpdate,
					govUpdate.minaVaultParamsUpdate,
					publicInput.vaultState.minaVaultTypeState.parameters
				)

				publicInput.vaultState.suiVaultTypeState.parameters = Provable.if(
					govUpdate.applySuiVaultParamsUpdate,
					govUpdate.suiVaultParamsUpdate,
					publicInput.vaultState.suiVaultTypeState.parameters
				)

				publicInput.zkUsdEnclavesState = Provable.if(
					govUpdate.applyEnclaveStateUpdate,
					govUpdate.enclaveStateUpdate,
					publicInput.zkUsdEnclavesState
				)

				publicInput.globalParametersState = Provable.if(
					govUpdate.applyGlobalParametersStateUpdate,
					govUpdate.globalParametersStateUpdate,
					publicInput.globalParametersState
				)

				publicInput.governanceState = Provable.if(
					govUpdate.applyGovernanceStateUpdate,
					publicInput.governanceState.applyUpdate(govUpdate.governanceStateUpdate),
					publicInput.governanceState
				)

				publicInput.regulatoryState = Provable.if(
					govUpdate.applyRegulatoryStateUpdate,
					govUpdate.regulatoryStateUpdate,
					publicInput.regulatoryState
				)

				return { publicOutput: publicInput }
			}
	},
	// governanceUpdateIntent: {
	// 	privateInputs: [GovActionIntentPrivateInput],
	// 	async method(
	// 		publicInput: ZkUsdRollupState,
	// 		privateInput: GovActionIntentPrivateInput
	// 	): Promise<{ publicOutput: ZkUsdRollupState }> {
	// 		// Verify the intent proof
	// 		privateInput.proof.verify();
			
	// 		// output is input plus value from the proof
	// 		const publicOutput = ZkUsdRollupState.empty();
	// 		return { publicOutput: publicInput };
	// 	}
	// },
	blockCloseIntent: {
		privateInputs: [BlockCloseIntentPrivateInput],
		async method(
			publicInput: FizkRollupState,
			privateInput: BlockCloseIntentPrivateInput
		): Promise<{ publicOutput: FizkRollupState }> {

			// save the previous state in the merkle map
			const previousStateHash: Field = Poseidon.hash(publicInput.toFields());

			// - update the price and rate for each collateral type
			privateInput.oracleBlockDataProof.verify();
			
			publicInput.vaultState.minaVaultTypeState.priceNanoUsd = privateInput.oracleBlockDataProof.publicOutput.minaVaultTypeUpdate.priceNanoUsd
			publicInput.vaultState.minaVaultTypeState.globalAccumulativeInterestRateScaled = privateInput.oracleBlockDataProof.publicOutput.minaVaultTypeUpdate.blockRateScaledUpdate;

			publicInput.vaultState.suiVaultTypeState.priceNanoUsd = privateInput.oracleBlockDataProof.publicOutput.suiVaultTypeUpdate.priceNanoUsd
			publicInput.vaultState.suiVaultTypeState.globalAccumulativeInterestRateScaled = privateInput.oracleBlockDataProof.publicOutput.suiVaultTypeUpdate.blockRateScaledUpdate;
			
			// Copy live roots to intent roots for all state maps
			copyLiveRootsToIntentRoots(publicInput);
			
			// Update block info and store previous state in historical state tree
			updateBlockInfoState(
			  privateInput.historicalStateMap as HistoricalBlockStateMap,
			  privateInput.oracleBlockDataProof.publicOutput.timestamp,
			  publicInput.blockInfoState,
			  previousStateHash,
			);

			return { publicOutput: publicInput };
		}
	}
		
	}	
});


