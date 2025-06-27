import { Field, Poseidon, Struct, UInt64, ZkProgram } from "o1js";
import { GovActionIntentPrivateInput } from "./intents/governance/wrapper.js";
import { ZkUsdRollupState } from "./domain/rollup-state.js";
import { BlockCloseIntentPrivateInput } from "./intents/block-close-intent.js";
import { HistoricalBlockStateMap } from "./domain/block-info/historical-block-state-map.js";
import { BlockInfoState } from "./domain/block-info/block-info-state.js";

/**
 * Copies live roots to intent roots for all state maps in the rollup state
 * @param state The rollup state to update
 */
function copyLiveRootsToIntentRoots(state: ZkUsdRollupState): void {
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
 * @param timestamp The timestamp of the block
 * @param blockInfoState The block info state to update
 * @param previousStateHash The hash of the previous state
 * @param historicalStateTree The historical state tree to update
 * @returns The updated block info state
 */
function updateBlockInfoState(
	timestamp: UInt64,
  blockInfoState: BlockInfoState,
  previousStateHash: Field,
  historicalStateTree: HistoricalBlockStateMap
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




export const ZkusdRollup = ZkProgram({
  name: 'ZkusdRollup',
  publicInput: ZkUsdRollupState,
  publicOutput: ZkUsdRollupState,
  methods: {
	governanceUpdateIntent: {
		privateInputs: [GovActionIntentPrivateInput],
		async method(
			publicInput: ZkUsdRollupState,
			privateInput: GovActionIntentPrivateInput
		): Promise<{ publicOutput: ZkUsdRollupState }> {
			// Verify the intent proof
			privateInput.proof.verify();
			
			// output is input plus value from the proof
			const publicOutput = ZkUsdRollupState.empty();
			return { publicOutput: publicInput };
		}
	},
	blockCloseIntent: {
		privateInputs: [BlockCloseIntentPrivateInput],
		async method(
			publicInput: ZkUsdRollupState,
			privateInput: BlockCloseIntentPrivateInput
		): Promise<{ publicOutput: ZkUsdRollupState }> {

			// save the previous state in the merkle map
			const previousStateHash: Field = Poseidon.hash(publicInput.toFields());

			// - update the price for each collateral type
			privateInput.observerPriceProof.verify();
			
			publicInput.vaultState.minaVaultParameters.priceNanoUsd = privateInput.observerPriceProof.publicOutput.minaPriceNanoUsd;
			publicInput.vaultState.suiVaultParameters.priceNanoUsd = privateInput.observerPriceProof.publicOutput.suiPriceNanoUsd;
			
			// - calculate the new rate per collateral type <--- (this is where we need the timestamp)
			
			
			// Copy live roots to intent roots for all state maps
			copyLiveRootsToIntentRoots(publicInput);
			
			// Update block info and store previous state in historical state tree
			// TODO: Get the historical state tree properly
			const historicalStateTree: HistoricalBlockStateMap = undefined as unknown as HistoricalBlockStateMap;
			updateBlockInfoState(
				privateInput.observerPriceProof.publicOutput.timestamp,
			  publicInput.blockInfoState,
			  previousStateHash,
			  historicalStateTree
			);

			return { publicOutput: publicInput };
		}
	}
		
	}	
});


