
// - The fizk token map
//   - intent
//   - live
// - ioMap  (burn/mint record map), one but decorated with destination chains
//   - intent
//   - live

import { Field, Struct } from "o1js";
import { MerkleRoot } from "../../core/map/merkle-root.js";
import { IoMap } from "../bridging/io-map.js";
import { FizkTokenMap } from "./fizk-token-map.js";

export class FizkTokenState extends Struct({
    fizkTokenMapRoot: MerkleRoot<FizkTokenMap>,
    ioMapRoot: MerkleRoot<IoMap>,
}) {
    toFields(): Field[] {
        return [
            this.fizkTokenMapRoot.root,
            this.ioMapRoot.root,
        ];
    }
}
