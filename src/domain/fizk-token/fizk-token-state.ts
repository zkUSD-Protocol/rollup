
// - The fizk token map
//   - intent
//   - live
// - ioMap  (burn/mint record map), one but decorated with destination chains
//   - intent
//   - live

import { Field, Struct } from "o1js";
import { RollupRoots } from "../../core/map/merkle-root.js";
import { IoMap } from "../../core/map/io-map.js";
import { FizkTokenMap } from "./fizk-token-map.js";

export class FizkTokenState extends Struct({
    fizkTokenMapRoot: RollupRoots<FizkTokenMap>(),
    ioMapRoot: RollupRoots<IoMap>(),
}) {
    toFields(): Field[] {
        return [
            this.fizkTokenMapRoot.intentRoot.root,
            this.fizkTokenMapRoot.liveRoot.root,
            this.ioMapRoot.intentRoot.root,
            this.ioMapRoot.liveRoot.root,
        ];
    }
}
