import { Struct, UInt32 } from "o1js";
import { RollupRoots } from "../../core/map/merkle-root.js";
import { IoMap   } from "../../core/map/io-map.js";
import { ZkUsdMap } from "./zkusd-map.js";

export class ZkUsdState extends Struct({
    ioMapRoot: RollupRoots<IoMap>(),
    zkUsdMapRoot: RollupRoots<ZkUsdMap>(),
    trasactionFee: UInt32,
    govRewardFeePercentage: UInt32,
}) {



    
	
}