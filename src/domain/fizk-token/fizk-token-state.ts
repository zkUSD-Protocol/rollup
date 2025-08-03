import { Field, Struct } from "o1js";
import { MerkleRoot } from "../../core/map/merkle-root.js";
import { CollateralIoMap } from "../bridging/collateral-io-map.js";
import { FizkTokenMap } from "./fizk-token-map.js";
import { UInt64 } from "o1js";
import { InterBlockUInt64 } from "../../core/inter-block.js";

export class FizkTokenState extends Struct({
    fizkPriceNanoUsd: InterBlockUInt64,
    fizkTokenMapRoot: MerkleRoot<FizkTokenMap>,
    ioMapRoot: MerkleRoot<CollateralIoMap>,
}) {
    toFields(): Field[] {
        return [
            this.fizkPriceNanoUsd.previous.value,
            this.fizkPriceNanoUsd.current.value,
            this.fizkTokenMapRoot.root,
            this.ioMapRoot.root,
        ];
    }
}
