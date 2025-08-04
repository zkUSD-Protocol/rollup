import { Field, Struct } from "o1js";
import { ZkUsdState } from "./zkusd/zkusd-state.js";
import { GovernanceState } from "./governance/governance-state.js";
import { GlobalParametersState } from "./global-parameters/global-parameters-state.js";
import { RegulatoryState } from "./regulatory/regulatory-state.js";
import { FizkTokenState } from "./fizk-token/fizk-token-state.js";
import { BlockInfoState } from "./block-info/block-info-state.js";
import { ZkusdEnclavesState } from "./enclave/zskud-enclaves-state.js";
import { ZkUsdVaults } from "./vault/zkusd-vaults.js";
import { RollupVerificationState } from "./rollup/rollup-verification-state.js";

// includes all the different states from the domain subfolders
export class FizkRollupState extends Struct({
    rollupVerificationState: RollupVerificationState,
    zkUsdState: ZkUsdState,
    vaultState: ZkUsdVaults,
    governanceState: GovernanceState,
    globalParametersState: GlobalParametersState,
    regulatoryState: RegulatoryState,
    fizkTokenState: FizkTokenState,
    blockInfoState: BlockInfoState,
    enclavesState: ZkusdEnclavesState,
}){
	toFields() : Field[] {
		return [
			...this.rollupVerificationState.toFields(),
			...this.zkUsdState.toFields(),
			...this.vaultState.toFields(),
			...this.governanceState.toFields(),
			...this.globalParametersState.toFields(),
			...this.regulatoryState.toFields(),
			...this.fizkTokenState.toFields(),
			...this.blockInfoState.toFields(),
			...this.enclavesState.toFields(),
		];
	}

    // static empty() {
    //     return new ZkUsdRollupState({
    //         zkUsdState: ZkUsdState.empty(),
    //         vaultState: VaultState.empty(),
    //         governanceState: GovernanceState.empty(),
    //         globalParametersState: GlobalParametersState.empty(),
    //         regulatoryState: RegulatoryState.empty(),
    //         fizkTokenState: FizkTokenState.empty(),
    //         blockInfoState: BlockInfoState.empty(),
    //         zkUsdEnclavesState: ZkusdEnclavesState.empty(),
    //     });
    // }
}
        
