import { Struct, ZkProgram, DynamicProof, FeatureFlags, UInt64, Signature, PublicKey, Field } from "o1js";
import { DebtRepaymentUpdate } from "../domain/vault/vault-update.js";
import { CollateralType } from "../domain/vault/vault-collateral-type.js";
import { InputNotes, Note } from "../domain/zkusd/zkusd-note";
import { VaultAddress } from "../domain/vault/vault-address.js";
import { ZkUsdMap } from "../domain/zkusd/zkusd-map.js";
import { FizkRollupState } from "../domain/rollup-state.js";
import { FizkAddress } from "../domain/fizk-token/fizk-address.js";
import { ZkusdMapUpdateSingleOutput } from "../state-updates/zkusd-map-update.js";
import { verifyNoteSnapshotState } from "./helpers.js";
import { processInputNotes, processSingleOutputNote } from "./common/note-io-helper.js";
import { VaultParameters } from "../domain/vault/vault.js";

export class DeficitCoverageLiquidationPreconditions extends Struct({
  fizkPriceNanoUsd: UInt64,
  collateralPriceNanoUsd: UInt64,
  vaultParameters:    VaultParameters,
  noteSnapshotBlockNumber: UInt64,
  noteSnapshotBlockHash:   Field,
}) {}

export class DeficitCoverageLiquidationPrivateInput extends Struct({
  collateralType: CollateralType,
  inputNotes: InputNotes,
  outputNote: Note,
  signature: Signature,
  publicKey: PublicKey,
  liquidatee: VaultAddress,
  zkusdMap: ZkUsdMap,
  noteSnapshotState: FizkRollupState,
  fizkTokenReceiver: FizkAddress,
}) {}

export class DeficitCoverageLiquidationPublicOutput extends Struct({
  collateralType: CollateralType,
  fizkTokenReceiver: FizkAddress,
  debtRepaymentUpdate: DebtRepaymentUpdate,
  zkusdBurnUpdate: ZkusdMapUpdateSingleOutput,
}) {}

export const DeficitCoverageLiquidation = ZkProgram({
  name: "DeficitCoverageLiquidation",
  publicInput: DeficitCoverageLiquidationPreconditions,
  publicOutput: DeficitCoverageLiquidationPublicOutput,
  methods: {
    dummy: {
      privateInputs: [DeficitCoverageLiquidationPrivateInput],
      async method(
        publicInput: DeficitCoverageLiquidationPreconditions,
        privateInput: DeficitCoverageLiquidationPrivateInput & { zkusdMap: ZkUsdMap },
      ): Promise<{ publicOutput: DeficitCoverageLiquidationPublicOutput }> {
        const { zkusdMap } = privateInput;
        /* ---------- 1. verify the snapshot root ---------- */
        verifyNoteSnapshotState(
          privateInput.noteSnapshotState,
          zkusdMap,
          publicInput.noteSnapshotBlockHash,
        );

        /* ---------- 2. common note/nullifier processing --- */
        const { valueIn, nullifiers } = processInputNotes({
          zkusdMap,
          inputNotes: privateInput.inputNotes,
          spendingSignature: privateInput.signature,
          spendingPublicKey: privateInput.publicKey,
        });

        /* ---------- 3. process output notes ---------- */
        const { valueOut, outputNoteCommitment } = processSingleOutputNote({
          zkusdMap,
          outputNote: privateInput.outputNote,
        });
        valueIn.assertGreaterThan(valueOut);
        const valueRepaid = valueIn.sub(valueOut)
        
        /* ---------- 4. build the updates ---------- */
        const debtRepaymentUpdate = new DebtRepaymentUpdate({
          vaultAddress: privateInput.liquidatee,
          debtDelta: valueRepaid,
          collateralType: privateInput.collateralType,
        });

        const zkusdBurnUpdate = new ZkusdMapUpdateSingleOutput({
          nullifiers,
          outputNoteCommitment
        });

        const publicOutput = new DeficitCoverageLiquidationPublicOutput({
          collateralType: privateInput.collateralType,
          fizkTokenReceiver: privateInput.fizkTokenReceiver,
          debtRepaymentUpdate,
          zkusdBurnUpdate,
        });
        return { publicOutput };
      },
    },
  },
});

export class DeficitCoverageLiquidationProof extends ZkProgram.Proof(
  DeficitCoverageLiquidation,
) {}