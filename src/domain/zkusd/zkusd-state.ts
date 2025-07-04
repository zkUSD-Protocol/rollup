import { Field, Struct, UInt32 } from "o1js";
import { IoMap   } from "../bridging/io-map.js";
import { ZkUsdMap } from "./zkusd-map.js";
import { MerkleRoot } from "../../core/map/merkle-root.js";

export class ZkUsdState extends Struct({
    ioMapRoot: MerkleRoot<IoMap>,
    zkUsdMapRoot: MerkleRoot<ZkUsdMap>,
    trasactionFee: UInt32,
    govRewardFeePercentage: UInt32,
}) {
    toFields(): Field[] {
        return [
            this.ioMapRoot.root,
            this.zkUsdMapRoot.root,
            this.trasactionFee.value,
            this.govRewardFeePercentage.value,
        ];
    }



    
	
}