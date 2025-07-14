
import { Field, Poseidon } from "o1js";
import { FizkRollupState } from "../domain/rollup-state.js";
import { ZkUsdMap } from "../domain/zkusd/zkusd-map.js";
import { getRoot } from "../core/map/merkle-root.js";

/**
 * Verifies the integrity of a historical rollup state
 * 
 * @param noteSnapshotState - The historical rollup state to verify
 * @param zkusdMap - The zkUSD map matching the expected root
 * @param noteSnapshotBlockHash - The expected hash of the state
 * 
 * @throws If any of the following conditions are not met:
 * - The zkUSD map root matches the one stored in the historical rollup state
 * - The provided state hash matches the actual hash of the state
 */
export function verifyNoteSnapshotState(
  noteSnapshotState: FizkRollupState,
  zkusdMap: ZkUsdMap,
  noteSnapshotBlockHash: Field
) {
  
  // Verify the state matches the one in the block info
  const stateHash = Poseidon.hash(noteSnapshotState.toFields());
  stateHash.assertEquals(noteSnapshotBlockHash);
  
  // Verify the zkUSD map root matches
  const zkusdMapRoot = noteSnapshotState.zkUsdState.zkUsdMapRoot;
  zkusdMapRoot.assertEquals(getRoot(zkusdMap));
}
