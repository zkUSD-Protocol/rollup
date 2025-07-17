import { Poseidon, UInt64 } from "o1js";
import { FizkRollupState } from "../domain/rollup-state";
import { HistoricalBlockStateMap } from "../domain/block-info/historical-block-state-map";
import { BlockInfoState } from "../domain/block-info/block-info-state";

/* 
It checks if hMap matches the current block historical map commitment.
Then given a snaphot state it checks if it belongs to one of the 
historical states and that it is older than the current block by 
timeDeltaMs.
*/
export function verifySnapshotOlderBy(
  currentBlock: BlockInfoState,
  hMap: HistoricalBlockStateMap,
  snap: FizkRollupState,
  timeDeltaMs: UInt64,
) {
  hMap.root.assertEquals(currentBlock.historicalStateMerkleRoot.root);
  const snapHash = Poseidon.hash(snap.toFields());
  hMap.get(snap.blockInfoState.blockNumber.value).assertEquals(snapHash);
  currentBlock.previousBlockClosureTimestamp
    .isGreaterThanBy(
      snap.blockInfoState.previousBlockClosureTimestamp,
      timeDeltaMs,
    )
    .assertTrue();
}
