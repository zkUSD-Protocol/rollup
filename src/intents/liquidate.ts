import { ZkProgram, Struct, Signature, PublicKey, Field, UInt64, DynamicProof, FeatureFlags } from "o1js";
import { FizkRollupState } from "../domain/rollup-state.js";
import { InputNotes } from "../domain/zkusd/zkusd-note.js";
import { Note } from "../domain/zkusd/zkusd-note.js";
import { ZkusdMapUpdateSingleOutput } from "../state-updates/zkusd-map-update.js";
import { DebtRepaymentUpdate } from "../domain/vault/vault-update.js";
import { CollateralType } from "../domain/vault/vault-collateral-type.js";
import { ZkUsdMap } from "../domain/zkusd/zkusd-map.js";
import { VaultParameters } from "../domain/vault/vault.js";
import { verifyNoteSnapshotState } from "./helpers.js";
import { processInputNotes, processSingleOutputNote } from "./common/note-io-helper.js";
import { VaultAddress } from "../domain/vault/vault-address.js";

export class LiquidateIntentPreconditions extends Struct({
  vaultParameters:    VaultParameters,
  noteSnapshotBlockNumber: UInt64,
  noteSnapshotBlockHash:   Field,
}) {}

export class LiquidateIntentOutput extends Struct({
    vaultDebtRepayment: DebtRepaymentUpdate,
    zkusdBurnUpdate: ZkusdMapUpdateSingleOutput,
    liquidatorVaultAddress: VaultAddress
}) {}   

export class LiquidateIntentPrivateInput extends Struct({
  liquidatee:          VaultAddress,
  zkusdMap:            ZkUsdMap,
  noteSnapshotState:   FizkRollupState,
  inputNotes:          InputNotes,
  outputNote:          Note,
  spendingSignature:   Signature,
  spendingPublicKey:   PublicKey,
  collateralType:      CollateralType,
}) {}

export const LiquidateIntentKey = Field.from(
  '521902110912840918213924093811240', // TODO: replace with something structured
);

export const LiquidateIntent = ZkProgram({
  name:        'LiquidateIntent',
  publicInput: LiquidateIntentPreconditions,
  publicOutput: LiquidateIntentOutput,
  methods: {
    liquidate: {
      privateInputs: [LiquidateIntentPrivateInput],
      async method(
        publicInput: LiquidateIntentPreconditions,
        privateInput: LiquidateIntentPrivateInput & { zkusdMap: ZkUsdMap },
      ): Promise<{ publicOutput: LiquidateIntentOutput }> {
        const {
          noteSnapshotState,
          zkusdMap,
          inputNotes,
          outputNote,
          spendingSignature,
          spendingPublicKey,
          liquidatee,
          collateralType, 
        } = privateInput;

        /* ---------- 1. verify the snapshot root ---------- */
        verifyNoteSnapshotState(
          noteSnapshotState,
          zkusdMap,
          publicInput.noteSnapshotBlockHash,
        );

        /* ---------- 2. common note/nullifier processing --- */
        const { valueIn, nullifiers } = processInputNotes({
          zkusdMap,
          inputNotes,
          spendingSignature,
          spendingPublicKey,
        });

        /* ---------- 3. process output notes ---------- */
        const { valueOut, outputNoteCommitment } = processSingleOutputNote({
          zkusdMap,
          outputNote,
        });
        valueIn.assertGreaterThan(valueOut);
        const valueRepaid = valueIn.sub(valueOut)
        
        /* ---------- 4. build the updates ---------- */
        const vaultDebtRepayment = new DebtRepaymentUpdate({
          vaultAddress: liquidatee,
          debtDelta: valueRepaid,
          collateralType,
        });

        const zkusdBurnUpdate = new ZkusdMapUpdateSingleOutput({
          nullifiers,
          outputNoteCommitment
        });
        
        const liquidatorVaultAddress = VaultAddress.fromPublicKey(spendingPublicKey, collateralType);

        return {
          publicOutput: {
            vaultDebtRepayment,
            zkusdBurnUpdate,
            liquidatorVaultAddress,
          },
        };
      }
    },
  },
});

export class LiquidateIntentProof extends ZkProgram.Proof(LiquidateIntent) {}