import { Field, Poseidon, Provable, Struct } from "o1js";
import { VaultParameters } from "../domain/vault/vault.js";
import { CollateralType } from "../domain/vault/vault-collateral-type.js";
import { FizkRollupState } from "../domain/rollup-state.js";
import { UInt64 } from "o1js";

export class ComputationStepOutput extends Struct({
  fizkStateCommitment: Field,
  computationVkHTreeRoot: Field,
  blockNumber: UInt64,
}) {}

export function getActualVaultParams(
  state: FizkRollupState,
  collateralType: CollateralType,
): VaultParameters {
  return Provable.if(
    collateralType.equals(CollateralType.SUI),
    state.vaultState.suiVaultTypeState.parameters,
    state.vaultState.minaVaultTypeState.parameters,
  );
}

export function getComputationStepOutput(
  state: FizkRollupState,
): ComputationStepOutput {
  const ret = new ComputationStepOutput({
    fizkStateCommitment: Poseidon.hash(state.toFields()),
    computationVkHTreeRoot: state.governanceState.rollupProgramsVkhMapRoot.root,
    blockNumber: state.blockInfoState.blockNumber,
  });
  return ret;
}