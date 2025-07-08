import { Field, Poseidon, Provable, Struct, UInt64, ZkProgram } from "o1js";
import { FizkRollupState } from "./domain/rollup-state.js";
import { BlockCloseIntentPrivateInput } from "./intents/block-close-intent.js";
import { HistoricalBlockStateMap } from "./domain/block-info/historical-block-state-map.js";
import { BlockInfoState } from "./domain/block-info/block-info-state.js";
import { proposalInclusionCommitmentForStatus, GovActionType, GovProposalStatus, GovActionIntentProof, GovSystemUpdate } from "./intents/governance/wrapper.js";
import { ProposalMap } from "./domain/governance/proposal-map.js";
import { Timestamp } from "./core/timestamp.js";
import { CreateVaultIntentProof } from "./intents/create-vault.js";
import { VaultMap } from "./domain/vault/vault-map.js";
import { VaultParameters } from "./domain/vault/vault.js";
import { CollateralType } from "./domain/vault/vault-collateral-type.js";
import { DepositIntentProof } from "./intents/deposit.js";
import { CollateralIoMap } from "./domain/bridging/collateral-io-map.js";
import { CollateralIOAccumulators } from "./domain/bridging/collateral-io-accumulators.js";
import { RedeemIntentProof } from "./intents/redeem.js";
import { TransferIntentProof } from "./intents/transfer.js";
import { ZkUsdMap } from "./domain/zkusd/zkusd-map.js";
import { BurnIntentProof } from "./intents/burn.js";
import { MintIntentProof } from "./intents/mint.js";
import { BridgeIntentProof } from "./intents/bridge.js";
import { BridgeIoMap } from "./domain/bridging/bridge-io-map.js";
import { BridgeMap } from "./domain/bridging/bridge-map.js";

// make into a heler function
function getActualVaultParams(publicInput: FizkRollupState, collateralType: CollateralType): VaultParameters {
	return Provable.if(collateralType.equals(CollateralType.SUI),
		publicInput.vaultState.suiVaultTypeState.parameters,
		publicInput.vaultState.minaVaultTypeState.parameters
	);
}

/**
 * Applies governance updates to the rollup state
 * @param rollupState The current rollup state to update
 * @param govUpdate The governance system update to apply
 */
function applyGovernanceUpdates(
	rollupState: FizkRollupState,
	govUpdate: GovSystemUpdate
): void {
	// Apply vault parameter updates
	rollupState.vaultState.minaVaultTypeState.parameters = Provable.if(
		govUpdate.applyMinaVaultParamsUpdate,
		govUpdate.minaVaultParamsUpdate,
		rollupState.vaultState.minaVaultTypeState.parameters
	);

	rollupState.vaultState.suiVaultTypeState.parameters = Provable.if(
		govUpdate.applySuiVaultParamsUpdate,
		govUpdate.suiVaultParamsUpdate,
		rollupState.vaultState.suiVaultTypeState.parameters
	);

	// Apply enclave state update
	rollupState.zkUsdEnclavesState = Provable.if(
		govUpdate.applyEnclaveStateUpdate,
		govUpdate.enclaveStateUpdate,
		rollupState.zkUsdEnclavesState
	);

	// Apply global parameters update
	rollupState.globalParametersState = Provable.if(
		govUpdate.applyGlobalParametersStateUpdate,
		govUpdate.globalParametersStateUpdate,
		rollupState.globalParametersState
	);

	// Apply governance state update
	rollupState.governanceState = Provable.if(
		govUpdate.applyGovernanceStateUpdate,
		rollupState.governanceState.applyUpdate(govUpdate.governanceStateUpdate),
		rollupState.governanceState
	);

	// Apply regulatory state update
	rollupState.regulatoryState = Provable.if(
		govUpdate.applyRegulatoryStateUpdate,
		govUpdate.regulatoryStateUpdate,
		rollupState.regulatoryState
	);
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

/**
 * Verifies that a proposal snapshot is valid and not too old
 * @param historicalBlockStateMap The historical block state map
 * @param snapshotState The snapshot state to verify
 * @param currentBlockInfo The current block information
 * @param snapshotValidityMillis The maximum age of the snapshot in milliseconds
 * @throws If the snapshot verification fails
 */
function verifyProposalSnapshot(
	historicalBlockStateMap: HistoricalBlockStateMap,
	snapshotState: FizkRollupState,
	currentBlockInfo: BlockInfoState,
	snapshotValidityMillis: UInt64
): void {
	// Verify the historical block state map root matches the current state's historical state map root
	historicalBlockStateMap.root.assertEquals(currentBlockInfo.historicalStateMerkleRoot.root);

	// The snapshot must exist within history within threshold
	const snapshotHash = Poseidon.hash(snapshotState.toFields());
	historicalBlockStateMap.get(snapshotState.blockInfoState.blockNumber.value).assertEquals(snapshotHash);

	// Verify that the state matches the hash
	Poseidon.hash(snapshotState.toFields()).assertEquals(snapshotHash);

	// Check if the snapshot is not too old
	const snapshotTimestamp = snapshotState.blockInfoState.previousBlockClosureTimestamp;
	const currentTimestamp = currentBlockInfo.previousBlockClosureTimestamp;
	currentTimestamp.isGreaterBy(snapshotTimestamp, snapshotValidityMillis).assertFalse();
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

export class GovVetoProposalPrivateInput extends Struct({
	proof: GovActionIntentProof,
	liveProposalMap: ProposalMap,
	proposalSnapshotState: FizkRollupState,
	historicalBlockStateMap: HistoricalBlockStateMap,
}) {}


export class CreateVaultPrivateInput extends Struct({
	proof: CreateVaultIntentProof,
	vaultMap: VaultMap,
	iomap: CollateralIoMap,
}) {}


// export const DepositPrivateInput = (() => {
//   class _DepositPrivateInput extends Struct({
//     proof:   DepositIntentProof,
//     vaultMap: VaultMap,
//     iomap:    IoMap,
//   }) {}
//   return _DepositPrivateInput;
// })();
export class DepositPrivateInput extends Struct({
	proof: DepositIntentProof,
	vaultMap: VaultMap,
	iomap: CollateralIoMap,
}) {}

export class RedeemPrivateInput extends Struct({
	proof: RedeemIntentProof,
	vaultMap: VaultMap,
	iomap: CollateralIoMap,
}) {}

export class TransferPrivateInput extends Struct({
	historicalBlockStateMap: HistoricalBlockStateMap,
	zkusdMap: ZkUsdMap,
	proof: TransferIntentProof,
}) {}

export class BurnPrivateInput extends Struct({
	proof: BurnIntentProof,
	zkusdMap: ZkUsdMap,
	vaultMap: VaultMap,
	historicalBlockStateMap: HistoricalBlockStateMap,
}) {}
export class MintPrivateInput extends Struct({
	proof: MintIntentProof,
	zkusdMap: ZkUsdMap,
	vaultMap: VaultMap,
}) {}
export class BridgePrivateInput extends Struct({
	proof: BridgeIntentProof,
	bridgeMap: BridgeMap,
	zkusdMap: ZkUsdMap,
	bridgeIoMap: BridgeIoMap,
	historicalBlockStateMap: HistoricalBlockStateMap,
}) {}

// general todo:
// this methods are not atomic so if the execution breaks at some point then 
// the state may end up being inconsistent.
// Make sure that it won't happen or clone the data before.
export const ZkusdRollup = ZkProgram({
  name: 'ZkusdRollup',
  publicInput: FizkRollupState,
  publicOutput: FizkRollupState,
  methods: {
    createVault: {
      privateInputs: [CreateVaultPrivateInput],
      async method(
        publicInput: FizkRollupState,
        privateInput: CreateVaultPrivateInput & { proof: CreateVaultIntentProof, vaultMap: VaultMap, iomap: CollateralIoMap },
      ): Promise<{ publicOutput: FizkRollupState }> {
        // Verify the intent proof
        privateInput.proof.verify();

		// verify vault update
		const verifiedVaultUpdate = privateInput.vaultMap.verifyCreateVaultUpdate(publicInput.vaultState,privateInput.proof.publicOutput.update);
		
		// Verify the io map root matches the live io map
		const ioMap = privateInput.iomap;
		ioMap.getRoot().assertEquals(publicInput.vaultState.ioMapRoot);

		// create io accumulators for the vault
		ioMap.insert(privateInput.proof.publicOutput.update.vaultAddress.key, CollateralIOAccumulators.empty().pack());
		publicInput.vaultState.ioMapRoot = ioMap.getRoot();

        // update the vault map
		const vaultMap = privateInput.vaultMap;
		const newVaultMapRoot = vaultMap.verifiedInsert(verifiedVaultUpdate);
		publicInput.vaultState.vaultMapRoot = newVaultMapRoot;

        return {
          publicOutput: publicInput,
        };
      },
    },
	depositCollateral: {
		privateInputs: [DepositPrivateInput],
		async method(
			publicInput: FizkRollupState,
			privateInput: DepositPrivateInput & { vaultMap: VaultMap, iomap: CollateralIoMap }): Promise<{ publicOutput: FizkRollupState }> {
			
			// Verify the intent proof
			privateInput.proof.verify();
			const update = privateInput.proof.publicOutput.update;
			// Verify intent preconditions
			const preconditions = privateInput.proof.publicInput;
			const actualVaultParams = getActualVaultParams(publicInput, update.collateralType);
			preconditions.vaultParameters.equals(actualVaultParams).assertTrue();
			preconditions.observerKeysMerkleRoot.assertEquals(publicInput.zkUsdEnclavesState.observerKeysMerkleRoot);

			// Same for iomap
			const ioMap = privateInput.iomap;
			ioMap.getRoot().assertEquals(publicInput.vaultState.ioMapRoot);
			
			// Verify vault update
			const verifiedVaultUpdate = privateInput.vaultMap.verifyDepositCollateralUpdate(publicInput.vaultState,update);

			// verify and update io map
			const verifiedIoUpdate = ioMap.verifyDeposit(update);
			publicInput.vaultState.ioMapRoot = ioMap.verifiedUpdate(verifiedIoUpdate);

			// update the vault map
			const vaultMap = privateInput.vaultMap;
			const newVaultMapRoot = vaultMap.verifiedUpdate(verifiedVaultUpdate);
			publicInput.vaultState.vaultMapRoot = newVaultMapRoot;


			return {
				publicOutput: publicInput,
			};
		},
	},

	redeemCollateral: {
		privateInputs: [RedeemPrivateInput],
		async method(
			publicInput: FizkRollupState,
			privateInput: RedeemPrivateInput & { vaultMap: VaultMap, iomap: CollateralIoMap }): Promise<{ publicOutput: FizkRollupState }> {

				// Verify the intent proof
				privateInput.proof.verify();
				const update = privateInput.proof.publicOutput.update;
				// Verify intent preconditions
				const preconditions = privateInput.proof.publicInput;
				const actualVaultParams = getActualVaultParams(publicInput, update.collateralType);
				preconditions.vaultParameters.equals(actualVaultParams).assertTrue();
				
				// Verify that iomap is up-to-date
				const iomap = privateInput.iomap;
				iomap.getRoot().assertEquals(publicInput.vaultState.ioMapRoot);
				
				// verify vault update
				const verifiedVaultUpdate = privateInput.vaultMap.verifyRedeemCollateralUpdate(publicInput.vaultState,update);
				
				// update io map
				const verifiedIoUpdate = iomap.verifyWithdraw(update);
				publicInput.vaultState.ioMapRoot = iomap.verifiedUpdate(verifiedIoUpdate);

				// update the vault map
				const newVaultMapRoot = privateInput.vaultMap.verifiedUpdate(verifiedVaultUpdate);
				publicInput.vaultState.vaultMapRoot = newVaultMapRoot;

				return {
					publicOutput: publicInput,
				};
			},
	},	

	bridge: {
		privateInputs: [BridgePrivateInput],
		async method(
			publicInput: FizkRollupState,
			privateInput: BridgePrivateInput & { zkusdMap: ZkUsdMap, bridgeIoMap: BridgeIoMap, bridgeMap: BridgeMap, historicalBlockStateMap: HistoricalBlockStateMap }): Promise<{ publicOutput: FizkRollupState }> {
				// Verify the intent proof
			privateInput.proof.verify();

			// -- 	Verify intent preconditions
			const preconditions = privateInput.proof.publicInput;
			// historical proof check
			privateInput.historicalBlockStateMap.getRoot().assertEquals(publicInput.blockInfoState.historicalStateMerkleRoot);
			// the map must contain the block with the snapshot state
			privateInput.historicalBlockStateMap.get(preconditions.noteSnapshotBlockNumber.value).assertEquals(preconditions.noteSnapshotBlockHash);
			// the block number must not be greater than the current block number
			preconditions.noteSnapshotBlockNumber.assertLessThanOrEqual(publicInput.blockInfoState.blockNumber);
			// bridge map root must match
			privateInput.bridgeMap.getRoot().assertEquals(publicInput.zkUsdState.bridgeIoMapRoot)
			
			// verify bridge io ma update
			const verifiedIoMapUpdate = privateInput.bridgeIoMap.verifyBridgeSendIntent(privateInput.proof.publicOutput.bridgeIntentUpdate);
			// zkusd
			const zkusdMap = privateInput.zkusdMap;
			// verify and update the zkusd map
			const newZkusdMapRoot = zkusdMap.verifyAndUpdate(publicInput.zkUsdState, privateInput.proof.publicOutput.zkusdMapUpdate);
			publicInput.zkUsdState.zkUsdMapRoot = newZkusdMapRoot;
			// update io map
			const newIoMapRoot = privateInput.bridgeIoMap.verifiedSet(verifiedIoMapUpdate);
			publicInput.zkUsdState.bridgeIoMapRoot = newIoMapRoot;
			
			return {
				publicOutput: publicInput,
			};
			}
	},

	burn: {
		privateInputs: [BurnPrivateInput],
		async method(
			publicInput: FizkRollupState,
			privateInput: BurnPrivateInput & { zkusdMap: ZkUsdMap, vaultMap: VaultMap, historicalBlockStateMap: HistoricalBlockStateMap }): Promise<{ publicOutput: FizkRollupState }> {
				// Verify the intent proof
			privateInput.proof.verify();

			// -- 	Verify intent preconditions
			const preconditions = privateInput.proof.publicInput;
			const vaultUpdate = privateInput.proof.publicOutput.vaultUpdate;
			const actualVaultParams = getActualVaultParams(publicInput, vaultUpdate.collateralType);
			preconditions.vaultParameters.equals(actualVaultParams).assertTrue();
			// historical proof check
			privateInput.historicalBlockStateMap.getRoot().assertEquals(publicInput.blockInfoState.historicalStateMerkleRoot);
			// the map must contain the block with the snapshot state
			privateInput.historicalBlockStateMap.get(preconditions.noteSnapshotBlockNumber.value).assertEquals(preconditions.noteSnapshotBlockHash);
			// the block number must not be greater than the current block number
			preconditions.noteSnapshotBlockNumber.assertLessThanOrEqual(publicInput.blockInfoState.blockNumber);
			
			// verify vault update
			const verifiedVaultUpdate = privateInput.vaultMap.verifyRepayDebtUpdate(publicInput.vaultState,vaultUpdate);
			// zkusd
			const zkusdMap = privateInput.zkusdMap;
			// verify and update the zkusd map
			const newZkusdMapRoot = zkusdMap.verifyAndUpdate(publicInput.zkUsdState, privateInput.proof.publicOutput.zkusdMapUpdate);
			publicInput.zkUsdState.zkUsdMapRoot = newZkusdMapRoot;
			
			// update the vault map
			const newVaultMapRoot = privateInput.vaultMap.verifiedUpdate(verifiedVaultUpdate);
			publicInput.vaultState.vaultMapRoot = newVaultMapRoot;

			return {
				publicOutput: publicInput,
			};
		},
	},	

	mint: {
		privateInputs: [MintPrivateInput],
		async method(
			publicInput: FizkRollupState,
			privateInput: MintPrivateInput & { zkusdMap: ZkUsdMap, vaultMap: VaultMap, historicalBlockStateMap: HistoricalBlockStateMap }): Promise<{ publicOutput: FizkRollupState }> {
			// == Verify the intent proof
			privateInput.proof.verify();
			const vaultUpdate = privateInput.proof.publicOutput.vaultUpdate;

			// == Verify preconditions
			const currentBlockNumber = publicInput.blockInfoState.blockNumber;
			const priceBlockNumber = privateInput.proof.publicInput.rollupStateBlockNumber;

			// pick the price from the rollup state
			const collateralPriceNanoUsd = Provable.if(vaultUpdate.collateralType.equals(CollateralType.SUI), publicInput.vaultState.suiVaultTypeState.priceNanoUsd, publicInput.vaultState.minaVaultTypeState.priceNanoUsd);

			// verify state hash
			const currentStateCondition = currentBlockNumber.equals(priceBlockNumber).and(
				privateInput.proof.publicInput.collateralPriceNanoUsd.equals(collateralPriceNanoUsd)
			)

			// get historical state from the historical block state map
			const previousBlockStateHash = privateInput.historicalBlockStateMap.get(priceBlockNumber.value);

			const previousStateCondition = currentBlockNumber.sub(1).equals(priceBlockNumber).and(
				previousBlockStateHash.equals(privateInput.proof.publicInput.rollupStateHash)
			);

			// its either the current block or the previous block
			currentStateCondition.or(previousStateCondition).assertTrue();

			// verify vault map update
			const verifiedVaultUpdate = privateInput.vaultMap.verifyMintUpdate(publicInput.vaultState,vaultUpdate);
			// verify and update zkusd map
			const zkusdMap = privateInput.zkusdMap;
			const newZkusdMapRoot = zkusdMap.verifyAndUpdate(publicInput.zkUsdState, privateInput.proof.publicOutput.zkusdMapUpdate);
			publicInput.zkUsdState.zkUsdMapRoot = newZkusdMapRoot;
			
			// update the vault map
			publicInput.vaultState.vaultMapRoot = privateInput.vaultMap.verifiedUpdate(verifiedVaultUpdate);
			
			return {
				publicOutput: publicInput,
			};
		}
	},	


	transfer: {
		privateInputs: [TransferPrivateInput],
		async method(
			publicInput: FizkRollupState,
			privateInput: TransferPrivateInput & { zkusdMap: ZkUsdMap, historicalBlockStateMap: HistoricalBlockStateMap }): Promise<{ publicOutput: FizkRollupState }> {
				
        privateInput.proof.verify();
        const { nullifiers, outputNoteCommitments } = privateInput.proof.publicOutput.zkusdMapUpdate;
        const { noteSnapshotBlockNumber, noteSnapshotBlockHash } = privateInput.proof.publicInput;

		// verify the proof preconditions
		privateInput.historicalBlockStateMap.getRoot().assertEquals(publicInput.blockInfoState.historicalStateMerkleRoot);
		// the map must contain the block with the snapshot state
		privateInput.historicalBlockStateMap.get(noteSnapshotBlockNumber.value).assertEquals(noteSnapshotBlockHash);
		// the block number must not be greater than the current block number
		noteSnapshotBlockNumber.assertLessThanOrEqual(publicInput.blockInfoState.blockNumber);
		// now we know that the input notes used in the transfer intent were existing at this point of time.

		const zkUsdMap = privateInput.zkusdMap;
		
		const newZkusdMapRoot = zkUsdMap.verifyAndUpdate(publicInput.zkUsdState, privateInput.proof.publicOutput.zkusdMapUpdate);
		publicInput.zkUsdState.zkUsdMapRoot = newZkusdMapRoot;
			
			return {
				publicOutput: publicInput,
			};
		},
	},
	govCreateProposal: {
		privateInputs: [GovCreateProposalPrivateInput],
		async method(
			publicInput: FizkRollupState,
			privateInput: GovCreateProposalPrivateInput & { liveProposalMap: ProposalMap }): Promise<{ publicOutput: FizkRollupState }> {

		    // this should verify that enough stake voted for creation of this update
		    // or that the council has signed it
			// the stake root is later checked against the snapshot stake map
			privateInput.proof.verify();

			// Verify the proposal snapshot is valid and not too old
			verifyProposalSnapshot(
				privateInput.historicalBlockStateMap as HistoricalBlockStateMap,
				privateInput.proposalSnapshotState,
				publicInput.blockInfoState,
				publicInput.governanceState.proposalSnapshotValidityMillis
			);

			// proposal map must be up-to-date
			publicInput.governanceState.proposalMapRoot.assertEquals(privateInput.liveProposalMap.getRoot());

			// get the current proposal index
			const proposalIndex = publicInput.governanceState.lastProposalIndex.add(1);
			// update the current proposal index
			publicInput.governanceState.lastProposalIndex = proposalIndex;

			// create proposal commitment for the current block
			const pendingProposalCommitment = proposalInclusionCommitmentForStatus(privateInput.proof.publicOutput.proposal, proposalIndex, publicInput.blockInfoState, GovProposalStatus.pending);
			privateInput.liveProposalMap.insert(proposalIndex, pendingProposalCommitment);

			// update the proposal map root
			publicInput.governanceState.proposalMapRoot = privateInput.liveProposalMap.getRoot();

			return { publicOutput: publicInput }
		}
	},
	govVetoProposal: {
		privateInputs: [GovVetoProposalPrivateInput],
		async method(
			publicInput: FizkRollupState,
			privateInput: GovVetoProposalPrivateInput & { liveProposalMap: ProposalMap }): Promise<{ publicOutput: FizkRollupState }> {
			privateInput.proof.verify();

			// asset it's a veto
			privateInput.proof.publicOutput.govActionType.assertEquals(GovActionType.vetoProposal);

			// Verify the proposal snapshot is valid and not too old
			verifyProposalSnapshot(
				privateInput.historicalBlockStateMap as HistoricalBlockStateMap,
				privateInput.proposalSnapshotState,
				publicInput.blockInfoState,
				publicInput.governanceState.proposalSnapshotValidityMillis
			);

			// proposal map must be up-to-date
			publicInput.governanceState.proposalMapRoot.assertEquals(privateInput.liveProposalMap.getRoot());

			// check if proposal is present under index and its state is pending
			const proposalIndex = privateInput.proof.publicOutput.proposalIndex;
			const proposalInclusionBlockInfo = privateInput.proof.publicOutput.proposalInclusionBlockInfo;
			const pendingProposalCommitment = proposalInclusionCommitmentForStatus(privateInput.proof.publicOutput.proposal, proposalIndex, proposalInclusionBlockInfo, GovProposalStatus.pending);
			privateInput.liveProposalMap.get(proposalIndex).assertEquals(pendingProposalCommitment);

			// update the proposal to be vetoed
			const vetoedProposalCommitment = proposalInclusionCommitmentForStatus(privateInput.proof.publicOutput.proposal, proposalIndex, proposalInclusionBlockInfo, GovProposalStatus.vetoed);
			privateInput.liveProposalMap.update(proposalIndex, vetoedProposalCommitment);

			// update the root
			publicInput.governanceState.proposalMapRoot = privateInput.liveProposalMap.getRoot();
			
			return { publicOutput: publicInput }
		}
	},
	govExecuteUpdateIntent: {
		privateInputs: [GovExecuteUpdatePrivateInput],
		async method(
			publicInput: FizkRollupState,
			privateInput: GovExecuteUpdatePrivateInput & { liveProposalMap: ProposalMap }): Promise<{ publicOutput: FizkRollupState }> {

				const proof = privateInput.proof;
				const proofOutput = proof.publicOutput;

				// verify the update proof
				proof.verify();

				// assert it's an execution
				proof.publicOutput.govActionType.assertEquals(GovActionType.executeUpdate);
				
				// proposal map must be up-to-date
				privateInput.liveProposalMap.getRoot().assertEquals(publicInput.governanceState.proposalMapRoot);

				// the proposal can be executed against the map
				// verify the creation timestamp is bigger than the required delay
				const proposalCreationTimestamp = proofOutput.proposalInclusionBlockInfo.previousBlockClosureTimestamp;
				const currentTimestamp = publicInput.blockInfoState.previousBlockClosureTimestamp;
				proposalCreationTimestamp.isGreaterBy(currentTimestamp, publicInput.governanceState.proposalExecutionDelayMillis);

				// TODO do we also expire proposals that can be executed?

				// get the proposal commitment and check against the map
				const proposalCommitment = proposalInclusionCommitmentForStatus(proofOutput.proposal, proofOutput.proposalIndex, proofOutput.proposalInclusionBlockInfo, GovProposalStatus.pending);
				privateInput.liveProposalMap.get(proofOutput.proposalIndex).assertEquals(proposalCommitment);
				
				// the update is verified at this point - apply
				const govUpdate = proofOutput.govSystemUpdate;
				
				applyGovernanceUpdates(publicInput, govUpdate);

				// update proposal map
				const executedProposalCommitment = proposalInclusionCommitmentForStatus(proofOutput.proposal, proofOutput.proposalIndex, proofOutput.proposalInclusionBlockInfo, GovProposalStatus.executed);
				privateInput.liveProposalMap.update(proofOutput.proposalIndex, executedProposalCommitment);
				publicInput.governanceState.proposalMapRoot = privateInput.liveProposalMap.getRoot();
				
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
			
			// Update block info and store previous state in historical state tree
			updateBlockInfoState(
			  privateInput.historicalStateMap as HistoricalBlockStateMap,
			  privateInput.oracleBlockDataProof.publicOutput.timestamp,
			  publicInput.blockInfoState,
			  previousStateHash,
			);

			return { publicOutput: publicInput };
		}
	},
}
	
});