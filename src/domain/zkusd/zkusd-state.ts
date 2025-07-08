import { Field, Struct, UInt32 } from "o1js";
import { CollateralIoMap   } from "../bridging/collateral-io-map.js";
import { ZkUsdMap } from "./zkusd-map.js";
import { MerkleRoot } from "../../core/map/merkle-root.js";
import { BridgeIoMap } from "../bridging/bridge-io-map.js";

export class ZkUsdState extends Struct({
    ioMapRoot: MerkleRoot<CollateralIoMap>,
    bridgeIoMapRoot: MerkleRoot<BridgeIoMap>,
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