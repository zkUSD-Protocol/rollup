import { DynamicProof, FeatureFlags, Field, Poseidon, Provable, Struct, UInt64, VerificationKey, ZkProgram } from "o1js";

import { FizkRollupState } from "../domain/rollup-state.js";
import { BlockCloseIntentPrivateInput } from "../intents/block-close-intent.js";
import { HistoricalBlockStateMap } from "../domain/block-info/historical-block-state-map.js";
import { BlockInfoState } from "../domain/block-info/block-info-state.js";
import {
  proposalInclusionCommitmentForStatus,
  GovActionType,
  GovProposalStatus,
  GovSystemUpdate,
  GovActionIntentDynamicProof,
} from "../intents/governance/wrapper.js";
import { ProposalMap } from "../domain/governance/proposal-map.js";
import { Timestamp } from "../core/timestamp.js";
import { CreateVaultIntentDynamicProof } from "../intents/create-vault.js";
import { VaultMap } from "../domain/vault/vault-map.js";
import { VaultParameters } from "../domain/vault/vault.js";
import { CollateralType } from "../domain/vault/vault-collateral-type.js";
import { DepositIntentDynamicProof } from "../intents/deposit.js";
import { CollateralIoMap } from "../domain/bridging/collateral-io-map.js";
import { CollateralIOAccumulators } from "../domain/bridging/collateral-io-accumulators.js";
import { RedeemIntentDynamicProof } from "../intents/redeem.js";
import { TransferIntentDynamicProof } from "../intents/transfer.js";
import { ZkUsdMap } from "../domain/zkusd/zkusd-map.js";
import { BurnIntentDynamicProof } from "../intents/burn.js";
import { MintIntentDynamicProof } from "../intents/mint.js";
import { BridgeInIntentDynamicProof } from "../intents/bridge-in.js";
import { BridgeIoMap } from "../domain/bridging/bridge-io-map.js";
import { BridgeMap } from "../domain/bridging/bridge-map.js";
import { ObserverMap } from "../domain/enclave/observer-map.js";
import { getRoot } from "../core/map/merkle-root.js";
import { LiquidateIntentDynamicProof } from "../intents/liquidate.js";
import { RedeemCollateralUpdate } from "../domain/vault/vault-update.js";
import { BridgeOutIntentDynamicProof } from "../intents/bridge-out.js";
import { ProofVerification, verifyDynamicProof, VkhMap } from "../domain/governance/vkh-map.js";
import { FizkWrapupPreconditions, FizkWrapupPublicOutput } from "../intents/fizk-token/wrapper.js";
import { ZkusdMapUpdate } from "../state-updates/zkusd-map-update.js";
import { DeficitCoverageLiquidationPreconditions, DeficitCoverageLiquidationPublicOutput } from "../intents/deficit-coverage-liquidation.js";
import { FizkMintUpdate } from "../domain/fizk-token/fizk-token-update.js";
import { UInt50 } from "../core/uint50.js";
import { FizkTokenMap } from "../domain/fizk-token/fizk-token-map.js";

function log(msg: string, v?: unknown) {
Provable.log(msg);
}
function getActualVaultParams(
  publicInput: FizkRollupState,
  collateralType: CollateralType,
): VaultParameters {
  return Provable.if(
    collateralType.equals(CollateralType.SUI),
    publicInput.vaultState.suiVaultTypeState.parameters,
    publicInput.vaultState.minaVaultTypeState.parameters,
  );
}

function applyGovernanceUpdates(
  rollupState: FizkRollupState,
  govUpdate: GovSystemUpdate,
): void {
  rollupState.vaultState.minaVaultTypeState.parameters = Provable.if(
    govUpdate.applyMinaVaultParamsUpdate,
    govUpdate.minaVaultParamsUpdate,
    rollupState.vaultState.minaVaultTypeState.parameters,
  );

  rollupState.vaultState.suiVaultTypeState.parameters = Provable.if(
    govUpdate.applySuiVaultParamsUpdate,
    govUpdate.suiVaultParamsUpdate,
    rollupState.vaultState.suiVaultTypeState.parameters,
  );

  rollupState.zkUsdEnclavesState = Provable.if(
    govUpdate.applyEnclaveStateUpdate,
    govUpdate.enclaveStateUpdate,
    rollupState.zkUsdEnclavesState,
  );

  rollupState.globalParametersState = Provable.if(
    govUpdate.applyGlobalParametersStateUpdate,
    govUpdate.globalParametersStateUpdate,
    rollupState.globalParametersState,
  );

  rollupState.governanceState = Provable.if(
    govUpdate.applyGovernanceStateUpdate,
    rollupState.governanceState.applyUpdate(govUpdate.governanceStateUpdate),
    rollupState.governanceState,
  );

  rollupState.regulatoryState = Provable.if(
    govUpdate.applyRegulatoryStateUpdate,
    govUpdate.regulatoryStateUpdate,
    rollupState.regulatoryState,
  );
}

function updateBlockInfoState(
  historicalStateTree: HistoricalBlockStateMap,
  timestamp: Timestamp,
  blockInfoState: BlockInfoState,
  previousStateHash: Field,
): void {
  historicalStateTree.insert(blockInfoState.blockNumber.value, previousStateHash);
  blockInfoState.blockNumber = blockInfoState.blockNumber.add(1);
  blockInfoState.previousBlockClosureTimestamp = timestamp;
  blockInfoState.intentSequence = blockInfoState.intentSequence.add(1);
}

function verifyProposalSnapshot(
  historicalBlockStateMap: HistoricalBlockStateMap,
  snapshotState: FizkRollupState,
  currentBlockInfo: BlockInfoState,
  snapshotValidityMillis: UInt64,
): void {
  historicalBlockStateMap.root.assertEquals(
    currentBlockInfo.historicalStateMerkleRoot.root,
  );
  const snapshotHash = Poseidon.hash(snapshotState.toFields());
  log("verifyProposalSnapshot: map root", historicalBlockStateMap.root);
  historicalBlockStateMap
    .get(snapshotState.blockInfoState.blockNumber.value)
    .assertEquals(snapshotHash);
  Poseidon.hash(snapshotState.toFields()).assertEquals(snapshotHash);
  const snapshotTimestamp = snapshotState.blockInfoState.previousBlockClosureTimestamp;
  const currentTimestamp = currentBlockInfo.previousBlockClosureTimestamp;
  currentTimestamp.isGreaterThanBy(snapshotTimestamp, snapshotValidityMillis).assertFalse();
}

export class GovExecuteUpdatePrivateInput extends Struct({
  proof: GovActionIntentDynamicProof,
  liveProposalMap: ProposalMap,
  proofVerification: ProofVerification,
}) {}


export class GovCreateProposalPrivateInput extends Struct({
	proof: GovActionIntentDynamicProof,
	liveProposalMap: ProposalMap,
	proposalSnapshotState: FizkRollupState,
	historicalBlockStateMap: HistoricalBlockStateMap,
	proofVerification: ProofVerification,
}) {}

export class GovVetoProposalPrivateInput extends Struct({
	proof: GovActionIntentDynamicProof,
	liveProposalMap: ProposalMap,
	proposalSnapshotState: FizkRollupState,
	historicalBlockStateMap: HistoricalBlockStateMap,
	proofVerification: ProofVerification,
}) {}


export class FizkTokenUpdateWrapupDynamicProof extends DynamicProof<FizkWrapupPreconditions, FizkWrapupPublicOutput> {
  static publicInputType = FizkWrapupPreconditions;
  static publicOutputType = FizkWrapupPublicOutput;
  static maxProofsVerified = 0 as const;

  static featureFlags = FeatureFlags.allNone; // should allow FizkTokenUpdateWrapup proofs
}

export class FizkTokenUpdateWrapupPrivateInput extends Struct({
	proof: FizkTokenUpdateWrapupDynamicProof,
  proofVerification: ProofVerification,
  fizkTokenMap: FizkTokenMap,
  zkUsdMap: ZkUsdMap,
}) {}

export class CreateVaultPrivateInput extends Struct({
	proof: CreateVaultIntentDynamicProof,
	vaultMap: VaultMap,
	iomap: CollateralIoMap,
	proofVerification: ProofVerification,
}) {}

export class DepositPrivateInput extends Struct({
	proof: DepositIntentDynamicProof,
	vaultMap: VaultMap,
	iomap: CollateralIoMap,
	proofVerification: ProofVerification,
}) {}

export class RedeemPrivateInput extends Struct({
	proof: RedeemIntentDynamicProof,
	vaultMap: VaultMap,
	iomap: CollateralIoMap,
	proofVerification: ProofVerification,
}) {}

export class TransferPrivateInput extends Struct({
	historicalBlockStateMap: HistoricalBlockStateMap,
	zkusdMap: ZkUsdMap,
	proof: TransferIntentDynamicProof,
	proofVerification: ProofVerification,
}) {}

export class BurnPrivateInput extends Struct({
	proof: BurnIntentDynamicProof,
	zkusdMap: ZkUsdMap,
	vaultMap: VaultMap,
	historicalBlockStateMap: HistoricalBlockStateMap,
	proofVerification: ProofVerification,
}) {}

export class LiquidatePrivateInput extends Struct({
	proof: LiquidateIntentDynamicProof,
	zkusdMap: ZkUsdMap,
	vaultMap: VaultMap,
	collateralIoMap: CollateralIoMap,
	historicalBlockStateMap: HistoricalBlockStateMap,
	proofVerification: ProofVerification,
}) {}
export class MintPrivateInput extends Struct({
	proof: MintIntentDynamicProof,
	zkusdMap: ZkUsdMap,
	vaultMap: VaultMap,
	historicalBlockStateMap: HistoricalBlockStateMap,
	proofVerification: ProofVerification,
}) {}
export class BridgeOutPrivateInput extends Struct({
	proof: BridgeOutIntentDynamicProof,
	bridgeMap: BridgeMap,
	zkusdMap: ZkUsdMap,
	bridgeIoMap: BridgeIoMap,
	historicalBlockStateMap: HistoricalBlockStateMap,
	proofVerification: ProofVerification,
}) {}

export class BridgeInPrivateInput extends Struct({
	proof: BridgeInIntentDynamicProof,
	observerMap: ObserverMap,
	zkusdMap: ZkUsdMap,
	bridgeIoMap: BridgeIoMap,
	proofVerification: ProofVerification,
}) {}

export class DeficitCoverageLiquidationIntentDynamicProof extends DynamicProof<DeficitCoverageLiquidationPreconditions, DeficitCoverageLiquidationPublicOutput> {
	static publicInputType = DeficitCoverageLiquidationPreconditions;
	static publicOutputType = DeficitCoverageLiquidationPublicOutput;
	static maxProofsVerified = 0 as const;
	static featureFlags = FeatureFlags.allNone;
}

export class DeficitCoverageLiquidationPrivateInput extends Struct({
	proof: DeficitCoverageLiquidationIntentDynamicProof,
	zkusdMap: ZkUsdMap,
	vaultMap: VaultMap,
	collateralIoMap: CollateralIoMap,
	historicalBlockStateMap: HistoricalBlockStateMap,
	proofVerification: ProofVerification,
  fizkTokenMap: FizkTokenMap,
}) {}

// verify that the given state existed and is in the past
function verifyHistoricalBlockState(
  rollupState: FizkRollupState,
  historicalBlockStateMap: HistoricalBlockStateMap,
  noteSnapshotBlockNumber: UInt64,
  noteSnapshotBlockHash: Field,
) {
  getRoot(historicalBlockStateMap).root.assertEquals(rollupState.blockInfoState.historicalStateMerkleRoot.root);
  log("verifyHistoricalBlockState: historicalBlockStateMap root", historicalBlockStateMap.root);
  historicalBlockStateMap.get(noteSnapshotBlockNumber.value).assertEquals(noteSnapshotBlockHash);
  noteSnapshotBlockNumber.assertLessThanOrEqual(rollupState.blockInfoState.blockNumber);
}

export const FizkStateUpdateRollup = ZkProgram({
  name: "FizkStateUpdateRollup",
  publicInput: FizkRollupState,
  publicOutput: FizkRollupState,
  methods: {
    fizkTokenUpdate: {
      privateInputs: [FizkTokenUpdateWrapupPrivateInput],
      async method(
        publicInput: FizkRollupState,
        privateInput: FizkTokenUpdateWrapupPrivateInput & {
          proofVerification: {verificationKey: VerificationKey, vkhKey: Field, vkhMap: VkhMap},
          fizkTokenMap: FizkTokenMap,
          zkUsdMap: ZkUsdMap,
        }
      ): Promise<{ publicOutput: FizkRollupState }> {
        // ----- verify proof preconditions
        const preconditions = privateInput.proof.publicInput;
        preconditions.totalAmountStaked.assertEquals(publicInput.governanceState.totalAmountStaked);
        // todo this should try both the previous block historical state or the current block historical state
        // alternatively it could be moved to the wrapup
        preconditions.currentRewardIndex.assertEquals(publicInput.governanceState.globalGovRewardIndex);
        preconditions.vkhMapRoot.assertEquals(publicInput.governanceState.rollupProgramsVkhMapRoot);

        // verify proof
        verifyDynamicProof(privateInput.proof, privateInput.proofVerification, publicInput.governanceState.rollupProgramsVkhMapRoot);

        // assert state equality 
        // TODO this is expensive may be we could use cheaper polynomial commitments for this (Silvana)
        Poseidon.hash(publicInput.toFields()).assertEquals(privateInput.proof.publicInput.rollupStateRoot);

        // verify fizk map
        publicInput.fizkTokenState.fizkTokenMapRoot.assertEquals(getRoot(privateInput.fizkTokenMap));

        // apply updates
        const newFizkTokenMapRoot = FizkTokenMap.applyVerifiedUpdates(privateInput.fizkTokenMap, privateInput.proof.publicOutput.verifiedFizkTokenUpdates, publicInput.blockInfoState.previousBlockClosureTimestamp, publicInput.governanceState.globalGovRewardIndex.current);

        // add output commitment to zkusd map
        const outputNoteCommitments = privateInput.proof.publicOutput.outputNoteCommitments;
        const zkusdMapUpdate: ZkusdMapUpdate = ZkusdMapUpdate.empty();
        zkusdMapUpdate.outputNoteCommitments = outputNoteCommitments;
        
        const newZkusdMapRoot = ZkUsdMap.verifyAndUpdate(privateInput.zkUsdMap, publicInput.zkUsdState.zkUsdMapRoot, zkusdMapUpdate);
        publicInput.zkUsdState.zkUsdMapRoot = newZkusdMapRoot;

        // update state
        publicInput.fizkTokenState.fizkTokenMapRoot = newFizkTokenMapRoot;

        // return updated state
        return { publicOutput: publicInput };
      }
    },
    createVault: {
      privateInputs: [CreateVaultPrivateInput],
      async method(
        publicInput: FizkRollupState,
        privateInput: CreateVaultPrivateInput & {
          vaultMap: VaultMap;
          iomap: CollateralIoMap;
          proofVerification: {verificationKey: VerificationKey, intentVkhKey: Field, vkhMap: VkhMap}
        },
      ): Promise<{ publicOutput: FizkRollupState }> {
        log("createVault: start");
        log("createVault: before proof.verify");
        privateInput.proof.verify(privateInput.proofVerification.verificationKey);
        privateInput.proofVerification.vkhMap.get(privateInput.proofVerification.vkhKey).assertEquals(privateInput.proofVerification.verificationKey.hash);
        publicInput.governanceState.rollupProgramsVkhMapRoot.assertEquals(getRoot(privateInput.proofVerification.vkhMap));
        log("createVault: after proof.verify");

        log("createVault: verify vault update");
        const verifiedVaultUpdate = VaultMap.verifyCreateVaultUpdate(
          privateInput.vaultMap,
          publicInput.vaultState,
          privateInput.proof.publicOutput.update,
        );

        const ioMap = privateInput.iomap;
        getRoot(ioMap).assertEquals(publicInput.vaultState.collateralIoMapRoot);
        ioMap.insert(
          privateInput.proof.publicOutput.update.vaultAddress.key,
          CollateralIOAccumulators.empty().pack(),
        );
        publicInput.vaultState.collateralIoMapRoot = getRoot(ioMap);

        log("createVault: updating VaultMap");
        const vaultMap = privateInput.vaultMap;
        const newVaultMapRoot = VaultMap.verifiedInsert(
          vaultMap,
          verifiedVaultUpdate,
        );
        publicInput.vaultState.vaultMapRoot = newVaultMapRoot;

        return { publicOutput: publicInput };
      },
    },

    depositCollateral: {
      privateInputs: [DepositPrivateInput],
      async method(
        publicInput: FizkRollupState,
        privateInput: DepositPrivateInput & {
          vaultMap: VaultMap;
          iomap: CollateralIoMap;
          proofVerification: {verificationKey: VerificationKey, intentVkhKey: Field, vkhMap: VkhMap}
        },
      ): Promise<{ publicOutput: FizkRollupState }> {
        log("depositCollateral: start");
        log("depositCollateral: before proof.verify");
        privateInput.proof.verify(privateInput.proofVerification.verificationKey);
        privateInput.proofVerification.vkhMap.get(privateInput.proofVerification.vkhKey).assertEquals(privateInput.proofVerification.verificationKey.hash);
        publicInput.governanceState.rollupProgramsVkhMapRoot.assertEquals(getRoot(privateInput.proofVerification.vkhMap));
        log("depositCollateral: after proof.verify");

        const update = privateInput.proof.publicOutput.update;
        const preconditions = privateInput.proof.publicInput;
        const actualVaultParams = getActualVaultParams(
          publicInput,
          update.collateralType,
        );
        preconditions.vaultParameters.equals(actualVaultParams).assertTrue();
        preconditions.observerKeysMerkleRoot.assertEquals(
          publicInput.zkUsdEnclavesState.observerKeysMerkleRoot,
        );

        const ioMap = privateInput.iomap;
        getRoot(ioMap).assertEquals(publicInput.vaultState.collateralIoMapRoot);

        log("depositCollateral: verify vault update");
        const verifiedVaultUpdate = VaultMap.verifyDepositCollateralUpdate(
          privateInput.vaultMap,
          publicInput.vaultState,
          update,
        );

        log("depositCollateral: verify & update io map");
        const verifiedIoUpdate = CollateralIoMap.verifyDeposit(ioMap, update);
        publicInput.vaultState.collateralIoMapRoot = CollateralIoMap.verifiedUpdate(
          ioMap,
          verifiedIoUpdate,
        );

        log("depositCollateral: update VaultMap root");
        const vaultMap = privateInput.vaultMap;
        publicInput.vaultState.vaultMapRoot = VaultMap.verifiedUpdate(
          vaultMap,
          verifiedVaultUpdate,
        );

		log("depositCollateral: end");
        return { publicOutput: publicInput };
      },
    },

    redeemCollateral: {
      privateInputs: [RedeemPrivateInput],
      async method(
        publicInput: FizkRollupState,
        privateInput: RedeemPrivateInput & {
          vaultMap: VaultMap;
          iomap: CollateralIoMap;
          proofVerification: {verificationKey: VerificationKey, intentVkhKey: Field, vkhMap: VkhMap}
        },
      ): Promise<{ publicOutput: FizkRollupState }> {
        log("redeemCollateral: before proof.verify");
        privateInput.proof.verify(privateInput.proofVerification.verificationKey);
        privateInput.proofVerification.vkhMap.get(privateInput.proofVerification.vkhKey).assertEquals(privateInput.proofVerification.verificationKey.hash);
        publicInput.governanceState.rollupProgramsVkhMapRoot.assertEquals(getRoot(privateInput.proofVerification.vkhMap));
        log("redeemCollateral: after proof.verify");

        const update = privateInput.proof.publicOutput.update;
        const preconditions = privateInput.proof.publicInput;
        const actualVaultParams = getActualVaultParams(
          publicInput,
          update.collateralType,
        );
        preconditions.vaultParameters.equals(actualVaultParams).assertTrue();

        const iomap = privateInput.iomap;
        getRoot(iomap).assertEquals(publicInput.vaultState.collateralIoMapRoot);

        log("redeemCollateral: verify vault update");
        const verifiedVaultUpdate = VaultMap.verifyRedeemCollateralUpdate(
          privateInput.vaultMap,
          publicInput.vaultState,
          update,
        );

        log("redeemCollateral: verify & update io map");
        const verifiedIoUpdate = CollateralIoMap.verifyWithdraw(iomap, update);
        publicInput.vaultState.collateralIoMapRoot = CollateralIoMap.verifiedUpdate(
          iomap,
          verifiedIoUpdate,
        );

        log("redeemCollateral: update VaultMap root");
        publicInput.vaultState.vaultMapRoot = VaultMap.verifiedUpdate(
          privateInput.vaultMap,
          verifiedVaultUpdate,
        );

        return { publicOutput: publicInput };
      },
    },

    bridgeOut: {
      privateInputs: [BridgeOutPrivateInput],
      async method(
        publicInput: FizkRollupState,
        privateInput: BridgeOutPrivateInput & {
          zkusdMap: ZkUsdMap;
          bridgeIoMap: BridgeIoMap;
          bridgeMap: BridgeMap;
          historicalBlockStateMap: HistoricalBlockStateMap;
          proofVerification: {verificationKey: VerificationKey, intentVkhKey: Field, vkhMap: VkhMap}
        },
      ): Promise<{ publicOutput: FizkRollupState }> {
        log("bridgeOut: before proof.verify");
        privateInput.proof.verify(privateInput.proofVerification.verificationKey);
        privateInput.proofVerification.vkhMap.get(privateInput.proofVerification.vkhKey).assertEquals(privateInput.proofVerification.verificationKey.hash);
        publicInput.governanceState.rollupProgramsVkhMapRoot.assertEquals(getRoot(privateInput.proofVerification.vkhMap));
        log("bridgeOut: after proof.verify");

        const preconditions = privateInput.proof.publicInput;
        getRoot(privateInput.historicalBlockStateMap).assertEquals(
          publicInput.blockInfoState.historicalStateMerkleRoot,
        );
        log("bridgeOut: historicalStateMap root", privateInput.historicalBlockStateMap.root);
        privateInput.historicalBlockStateMap
          .get(preconditions.noteSnapshotBlockNumber.value)
          .assertEquals(preconditions.noteSnapshotBlockHash);
        preconditions.noteSnapshotBlockNumber.assertLessThanOrEqual(
          publicInput.blockInfoState.blockNumber,
        );
        getRoot(privateInput.bridgeMap).assertEquals(
          publicInput.zkUsdState.bridgeIoMapRoot,
        );

        log("bridgeOut: verify BridgeIoMap update");
        const verifiedIoMapUpdate = BridgeIoMap.verifyBridgeSendIntent(
          privateInput.bridgeIoMap,
          privateInput.proof.publicOutput.bridgeIntentUpdate,
        );

        log("bridgeOut: update ZkUsdMap");
        const newZkusdMapRoot = ZkUsdMap.verifyAndUpdate(
          privateInput.zkusdMap,
          publicInput.zkUsdState.zkUsdMapRoot,
          privateInput.proof.publicOutput.zkusdMapUpdate,
        );
        publicInput.zkUsdState.zkUsdMapRoot = newZkusdMapRoot;

        log("bridgeOut: update BridgeIoMap root");
        publicInput.zkUsdState.bridgeIoMapRoot = BridgeIoMap.verifiedSet(
          privateInput.bridgeIoMap,
          verifiedIoMapUpdate,
        );

        log("bridgeOut: end");

        return { publicOutput: publicInput };
      },
    },

    bridgeIn: {
      privateInputs: [BridgeInPrivateInput],
      async method(
        publicInput: FizkRollupState,
        privateInput: BridgeInPrivateInput & {
          zkusdMap: ZkUsdMap;
          bridgeIoMap: BridgeIoMap;
          observerMap: ObserverMap;
          proofVerification: {verificationKey: VerificationKey, intentVkhKey: Field, vkhMap: VkhMap}
        },
      ): Promise<{ publicOutput: FizkRollupState }> {
        log("bridgeIn: before proof.verify");
        privateInput.proof.verify(privateInput.proofVerification.verificationKey);
        privateInput.proofVerification.vkhMap.get(privateInput.proofVerification.vkhKey).assertEquals(privateInput.proofVerification.verificationKey.hash);
        publicInput.governanceState.rollupProgramsVkhMapRoot.assertEquals(getRoot(privateInput.proofVerification.vkhMap));
        log("bridgeIn: after proof.verify");

        privateInput.proof.publicOutput.observersSignedCount.assertGreaterThanOrEqual(
          publicInput.governanceState.observersMultiSigTreshold,
        );

        const bridgedAddress =
          privateInput.proof.publicOutput.bridgeIntentUpdate.bridgedAddress;

        getRoot(privateInput.zkusdMap).assertEquals(
          publicInput.zkUsdState.zkUsdMapRoot,
        );
        getRoot(privateInput.bridgeIoMap).assertEquals(
          publicInput.zkUsdState.bridgeIoMapRoot,
        );

        log("bridgeIn: verify observerKeysMerkleRoot");
        const preconditions = privateInput.proof.publicInput;
        publicInput.zkUsdEnclavesState.observerKeysMerkleRoot.assertEquals(
          preconditions.observerMapRoot,
        );

        log("bridgeIn: verify BridgeIoMap accumulators");
        const actualAccumulators = BridgeIoMap.getAccumulators(
          privateInput.bridgeIoMap,
          bridgedAddress,
        );
        actualAccumulators.totalMinted.assertEquals(
          preconditions.totalAmountBridgedIn,
        );

        log("bridgeIn: verify BridgeIoMap receive update");
        const verifiedIoMapUpdate = BridgeIoMap.verifyBridgeReceiveIntent(
          privateInput.bridgeIoMap,
          privateInput.proof.publicOutput.bridgeIntentUpdate,
        );

        log("bridgeIn: update ZkUsdMap");
        const newZkusdMapRoot = ZkUsdMap.verifyAndUpdate(
          privateInput.zkusdMap,
          publicInput.zkUsdState.zkUsdMapRoot,
          privateInput.proof.publicOutput.zkusdMapUpdate,
        );
        publicInput.zkUsdState.zkUsdMapRoot = newZkusdMapRoot;

        log("bridgeIn: update BridgeIoMap root");
        publicInput.zkUsdState.bridgeIoMapRoot = BridgeIoMap.verifiedSet(
          privateInput.bridgeIoMap,
          verifiedIoMapUpdate,
        );
        
        log("bridgeIn: end");

        return { publicOutput: publicInput };
      },
    },

    burn: {
      privateInputs: [BurnPrivateInput],
      async method(
        publicInput: FizkRollupState,
        privateInput: BurnPrivateInput & { zkusdMap: ZkUsdMap; vaultMap: VaultMap, historicalBlockStateMap: HistoricalBlockStateMap, proofVerification: {verificationKey: VerificationKey, intentVkhKey: Field, vkhMap: VkhMap} },
      ): Promise<{ publicOutput: FizkRollupState }> {
        // verify proof
        verifyDynamicProof(
          privateInput.proof,
          privateInput.proofVerification,
          publicInput.governanceState.rollupProgramsVkhMapRoot
        );

        // verify preconditions
        const preconditions = privateInput.proof.publicInput;
        const vaultUpdate = privateInput.proof.publicOutput.vaultUpdate;
        const actualVaultParams = getActualVaultParams(
          publicInput,
          vaultUpdate.collateralType,
        );
        preconditions.vaultParameters.equals(actualVaultParams).assertTrue();

        verifyHistoricalBlockState(
          publicInput,
          privateInput.historicalBlockStateMap,
          preconditions.noteSnapshotBlockNumber.value,
          preconditions.noteSnapshotBlockHash,
        );

        
        

        // verify vault update
        const verifiedVaultUpdate = VaultMap.verifyRepayDebtUpdate(
          privateInput.vaultMap,
          publicInput.vaultState,
          vaultUpdate,
        );

        log("burn: update ZkUsdMap");
        const newZkusdMapRoot = ZkUsdMap.verifyAndUpdate(
          privateInput.zkusdMap,
          publicInput.zkUsdState.zkUsdMapRoot,
          privateInput.proof.publicOutput.zkusdMapUpdate,
        );
        publicInput.zkUsdState.zkUsdMapRoot = newZkusdMapRoot;

        log("burn: update VaultMap root");
        publicInput.vaultState.vaultMapRoot = VaultMap.verifiedUpdate(
          privateInput.vaultMap,
          verifiedVaultUpdate,
        );
        log("burn: end");

        return { publicOutput: publicInput };
      },
    },
 
    liquidate: {
      privateInputs: [LiquidatePrivateInput],
      async method(
        publicInput: FizkRollupState,
        privateInput: LiquidatePrivateInput & { zkusdMap: ZkUsdMap; vaultMap: VaultMap; collateralIoMap: CollateralIoMap, proofVerification: {verificationKey: VerificationKey, intentVkhKey: Field, vkhMap: VkhMap} },
      ): Promise<{ publicOutput: FizkRollupState }> {
        log("liquidate: before proof.verify");
        privateInput.proof.verify(privateInput.proofVerification.verificationKey);
        privateInput.proofVerification.vkhMap.get(privateInput.proofVerification.vkhKey).assertEquals(privateInput.proofVerification.verificationKey.hash);
        publicInput.governanceState.rollupProgramsVkhMapRoot.assertEquals(getRoot(privateInput.proofVerification.vkhMap));
        log("liquidate: after proof.verify");

        const preconditions = privateInput.proof.publicInput;
        const vaultUpdate = privateInput.proof.publicOutput.vaultDebtRepayment;
        const actualVaultParams = getActualVaultParams(
          publicInput,
          vaultUpdate.collateralType,
        );
        preconditions.vaultParameters.equals(actualVaultParams).assertTrue();

        getRoot(privateInput.historicalBlockStateMap).assertEquals(
          publicInput.blockInfoState.historicalStateMerkleRoot,
        );
        log("liquidate: historicalBlockStateMap root", privateInput.historicalBlockStateMap.root);
        privateInput.historicalBlockStateMap
          .get(preconditions.noteSnapshotBlockNumber.value)
          .assertEquals(preconditions.noteSnapshotBlockHash);
        preconditions.noteSnapshotBlockNumber.assertLessThanOrEqual(
          publicInput.blockInfoState.blockNumber,
        );

        // create iomap update based on the liquidation logic
        log("liquidate: verify VaultMap liquidation update");
        const { liquidateeCollateralDelta, liquidatorCollateralDelta, verifiedUpdate } = VaultMap.verifyLiquidationUpdate(
          privateInput.vaultMap,
          publicInput.vaultState,
          vaultUpdate,
        );
        
        // verify redeem collateral update
        log("liquidate: verify CollateralIoMap liquidatee update");
        const verifiedLiquidateeUpdate = CollateralIoMap.verifyWithdraw(
          privateInput.collateralIoMap,
          new RedeemCollateralUpdate({
            vaultAddress: vaultUpdate.vaultAddress,
            collateralDelta: liquidateeCollateralDelta,
            collateralType: vaultUpdate.collateralType,
          }),
        );

        // verify liquidator redeem collateral update
        log("liquidate: verify CollateralIoMap liquidator update");
        const verifiedLiquidatorUpdate = CollateralIoMap.verifyWithdraw(
          privateInput.collateralIoMap,
          new RedeemCollateralUpdate({
            vaultAddress: privateInput.proof.publicOutput.liquidatorVaultAddress,
            collateralDelta: liquidatorCollateralDelta,
            collateralType: vaultUpdate.collateralType,
          }),
        );

        log("liquidate: update ZkUsdMap root");
        const newZkusdMapRoot = ZkUsdMap.verifyAndUpdateSingleOutput(
          privateInput.zkusdMap,
          publicInput.zkUsdState.zkUsdMapRoot,
          privateInput.proof.publicOutput.zkusdBurnUpdate,
        );
        publicInput.zkUsdState.zkUsdMapRoot = newZkusdMapRoot;

        log("liquidate: update VaultMap root");
        publicInput.vaultState.vaultMapRoot = VaultMap.verifiedUpdate(
          privateInput.vaultMap,
          verifiedUpdate,
        );

        // apply the rest of the updates
        log("liquidate: update CollateralIoMap root");
        publicInput.vaultState.vaultMapRoot = VaultMap.verifiedUpdate(
          privateInput.vaultMap,
          verifiedUpdate,
        );

        log("liquidate: update CollateralIoMap root");
        publicInput.vaultState.collateralIoMapRoot = CollateralIoMap.verifiedUpdate(
          privateInput.collateralIoMap,
          verifiedLiquidateeUpdate,
        );
        // assert equal roots / TODO can be removed later
        getRoot(privateInput.collateralIoMap).assertEquals(publicInput.vaultState.collateralIoMapRoot);

        publicInput.vaultState.collateralIoMapRoot = CollateralIoMap.verifiedUpdate(
          privateInput.collateralIoMap,
          verifiedLiquidatorUpdate,
        );

        log("liquidate: end");
        return { publicOutput: publicInput };
      },
    },

    mint: {
      privateInputs: [MintPrivateInput],
      async method(
        publicInput: FizkRollupState,
        privateInput: MintPrivateInput & {
          zkusdMap: ZkUsdMap;
          vaultMap: VaultMap;
          historicalBlockStateMap: HistoricalBlockStateMap;
          proofVerification: {verificationKey: VerificationKey, intentVkhKey: Field, vkhMap: VkhMap}
        },
      ): Promise<{ publicOutput: FizkRollupState }> {
        
        verifyDynamicProof(privateInput.proof, privateInput.proofVerification, publicInput.governanceState.rollupProgramsVkhMapRoot);

        const vaultUpdate = privateInput.proof.publicOutput.vaultUpdate;
        const currentBlockNumber = publicInput.blockInfoState.blockNumber;
        const priceBlockNumber = privateInput.proof.publicInput.rollupStateBlockNumber;

        const currentCollateralPriceNanoUsd = Provable.if(
          vaultUpdate.collateralType.equals(CollateralType.SUI),
          publicInput.vaultState.suiVaultTypeState.priceNanoUsd.current,
          publicInput.vaultState.minaVaultTypeState.priceNanoUsd.current,
        );
        const previousCollateralPriceNanoUsd = Provable.if(
          vaultUpdate.collateralType.equals(CollateralType.SUI),
          publicInput.vaultState.suiVaultTypeState.priceNanoUsd.previous,
          publicInput.vaultState.minaVaultTypeState.priceNanoUsd.previous,
        );

        // take current if it is greater than or equal to minimal collateral price, otherwise take previous
        const selectedCollateralPriceNanoUsd = Provable.if(
          currentCollateralPriceNanoUsd.greaterThanOrEqual(privateInput.proof.publicInput.minimalCollateralPriceNanoUsd),
          currentCollateralPriceNanoUsd,
          previousCollateralPriceNanoUsd
        );
        
        // verify proof preconditions
        privateInput.proof.publicInput.minimalCollateralPriceNanoUsd.assertLessThanOrEqual(selectedCollateralPriceNanoUsd);

        const currentStateCondition = currentBlockNumber
          .equals(priceBlockNumber)
          .and(
            privateInput.proof.publicInput.collateralPriceNanoUsd.equals(
              currentCollateralPriceNanoUsd,
            ),
          );

        log("mint: historicalBlockStateMap root", privateInput.historicalBlockStateMap.root);
        const previousBlockStateHash = privateInput.historicalBlockStateMap.get(
          priceBlockNumber.value,
        );

        const previousStateCondition = currentBlockNumber
          .sub(1)
          .equals(priceBlockNumber)
          .and(
            previousBlockStateHash.equals(
              privateInput.proof.publicInput.rollupStateHash,
            )
          );

        currentStateCondition.or(previousStateCondition).assertTrue();

        log("mint: verify VaultMap mint update");
        const verifiedVaultUpdate = VaultMap.verifyMintUpdate(
          privateInput.vaultMap,
          publicInput.vaultState,
          vaultUpdate,
        );

        log("mint: update ZkUsdMap");
        const newZkusdMapRoot = ZkUsdMap.verifyAndUpdate(
          privateInput.zkusdMap,
          publicInput.zkUsdState.zkUsdMapRoot,
          privateInput.proof.publicOutput.zkusdMapUpdate,
        );
        publicInput.zkUsdState.zkUsdMapRoot = newZkusdMapRoot;

        log("mint: update VaultMap root");
        publicInput.vaultState.vaultMapRoot = VaultMap.verifiedUpdate(
          privateInput.vaultMap,
          verifiedVaultUpdate,
        );

        return { publicOutput: publicInput };
      },
    },

    transfer: {
      privateInputs: [TransferPrivateInput],
      async method(
        publicInput: FizkRollupState,
        privateInput: TransferPrivateInput & {
          zkusdMap: ZkUsdMap;
          historicalBlockStateMap: HistoricalBlockStateMap;
          proofVerification: {verificationKey: VerificationKey, intentVkhKey: Field, vkhMap: VkhMap}
        },
      ): Promise<{ publicOutput: FizkRollupState }> {
        log("transfer: before proof.verify");
        verifyDynamicProof(privateInput.proof, privateInput.proofVerification, publicInput.governanceState.rollupProgramsVkhMapRoot);
        log("transfer: after proof.verify");

        const { noteSnapshotBlockNumber, noteSnapshotBlockHash } = privateInput.proof.publicInput;
        
        verifyHistoricalBlockState(
          publicInput,
          privateInput.historicalBlockStateMap,
          noteSnapshotBlockNumber,
          noteSnapshotBlockHash,
        );

        log("transfer: update ZkUsdMap");
        const newZkusdMapRoot = ZkUsdMap.verifyAndUpdate(
          privateInput.zkusdMap,
          publicInput.zkUsdState.zkUsdMapRoot,
          privateInput.proof.publicOutput.zkusdMapUpdate,
        );
        publicInput.zkUsdState.zkUsdMapRoot = newZkusdMapRoot;

        return { publicOutput: publicInput };
      },
    },

    govCreateProposal: {
      privateInputs: [GovCreateProposalPrivateInput],
      async method(
        publicInput: FizkRollupState,
        privateInput: GovCreateProposalPrivateInput & {
          historicalBlockStateMap: HistoricalBlockStateMap;
          liveProposalMap: ProposalMap;
          proofVerification: {verificationKey: VerificationKey, intentVkhKey: Field, vkhMap: VkhMap}
        },
      ): Promise<{ publicOutput: FizkRollupState }> {
        log("govCreateProposal: before proof.verify");
        privateInput.proof.verify(privateInput.proofVerification.verificationKey);
        privateInput.proofVerification.vkhMap.get(privateInput.proofVerification.vkhKey).assertEquals(privateInput.proofVerification.verificationKey.hash);
        publicInput.governanceState.rollupProgramsVkhMapRoot.assertEquals(getRoot(privateInput.proofVerification.vkhMap));
        log("govCreateProposal: after proof.verify");

        verifyProposalSnapshot(
          privateInput.historicalBlockStateMap,
          privateInput.proposalSnapshotState,
          publicInput.blockInfoState,
          publicInput.governanceState.proposalSnapshotValidityMillis,
        );

        publicInput.governanceState.proposalMapRoot.assertEquals(
          getRoot(privateInput.liveProposalMap),
        );

        const proposalIndex = publicInput.governanceState.lastProposalIndex.add(1);
        publicInput.governanceState.lastProposalIndex = proposalIndex;

        const pendingProposalCommitment = proposalInclusionCommitmentForStatus(
          privateInput.proof.publicOutput.proposal,
          proposalIndex,
          publicInput.blockInfoState,
          GovProposalStatus.pending,
        );
        privateInput.liveProposalMap.insert(
          proposalIndex,
          pendingProposalCommitment,
        );
        publicInput.governanceState.proposalMapRoot = getRoot(
          privateInput.liveProposalMap,
        );

        return { publicOutput: publicInput };
      },
    },

    govVetoProposal: {
      privateInputs: [GovVetoProposalPrivateInput],
      async method(
        publicInput: FizkRollupState,
        privateInput: GovVetoProposalPrivateInput & { liveProposalMap: ProposalMap, proofVerification: {verificationKey: VerificationKey, intentVkhKey: Field, vkhMap: VkhMap} },
      ): Promise<{ publicOutput: FizkRollupState }> {
        log("govVetoProposal: before proof.verify");
        privateInput.proof.verify(privateInput.proofVerification.verificationKey);
        privateInput.proofVerification.vkhMap.get(privateInput.proofVerification.vkhKey).assertEquals(privateInput.proofVerification.verificationKey.hash);
        publicInput.governanceState.rollupProgramsVkhMapRoot.assertEquals(getRoot(privateInput.proofVerification.vkhMap));
        log("govVetoProposal: after proof.verify");

        privateInput.proof.publicOutput.govActionType.assertEquals(
          GovActionType.vetoProposal,
        );

        verifyProposalSnapshot(
          privateInput.historicalBlockStateMap as HistoricalBlockStateMap,
          privateInput.proposalSnapshotState,
          publicInput.blockInfoState,
          publicInput.governanceState.proposalSnapshotValidityMillis,
        );

        publicInput.governanceState.proposalMapRoot.assertEquals(
          getRoot(privateInput.liveProposalMap),
        );

        const proposalIndex = privateInput.proof.publicOutput.proposalIndex;
        const proposalInclusionBlockInfo =
          privateInput.proof.publicOutput.proposalInclusionBlockInfo;
        const pendingProposalCommitment = proposalInclusionCommitmentForStatus(
          privateInput.proof.publicOutput.proposal,
          proposalIndex,
          proposalInclusionBlockInfo,
          GovProposalStatus.pending,
        );
        log("govVetoProposal: proposalMap root", getRoot(privateInput.liveProposalMap));
        privateInput.liveProposalMap
          .get(proposalIndex)
          .assertEquals(pendingProposalCommitment);

        const vetoedCommitment = proposalInclusionCommitmentForStatus(
          privateInput.proof.publicOutput.proposal,
          proposalIndex,
          proposalInclusionBlockInfo,
          GovProposalStatus.vetoed,
        );
        privateInput.liveProposalMap.update(proposalIndex, vetoedCommitment);
        publicInput.governanceState.proposalMapRoot = getRoot(
          privateInput.liveProposalMap,
        );

        return { publicOutput: publicInput };
      },
    },

    govExecuteUpdateIntent: {
      privateInputs: [GovExecuteUpdatePrivateInput],
      async method(
        publicInput: FizkRollupState,
        privateInput: GovExecuteUpdatePrivateInput & { liveProposalMap: ProposalMap, proofVerification: {verificationKey: VerificationKey, intentVkhKey: Field, vkhMap: VkhMap} },
      ): Promise<{ publicOutput: FizkRollupState }> {
        log("govExecuteUpdateIntent: before proof.verify");
        privateInput.proof.verify(privateInput.proofVerification.verificationKey);
        privateInput.proofVerification.vkhMap.get(privateInput.proofVerification.vkhKey).assertEquals(privateInput.proofVerification.verificationKey.hash);
        publicInput.governanceState.rollupProgramsVkhMapRoot.assertEquals(getRoot(privateInput.proofVerification.vkhMap));
        log("govExecuteUpdateIntent: after proof.verify");

        const proofOutput = privateInput.proof.publicOutput;
        proofOutput.govActionType.assertEquals(GovActionType.executeUpdate);

        getRoot(privateInput.liveProposalMap).assertEquals(
          publicInput.governanceState.proposalMapRoot,
        );

        const proposalCreationTimestamp =
          proofOutput.proposalInclusionBlockInfo.previousBlockClosureTimestamp;
        const currentTimestamp =
          publicInput.blockInfoState.previousBlockClosureTimestamp;
        proposalCreationTimestamp.isGreaterThanBy(
          currentTimestamp,
          publicInput.governanceState.proposalExecutionDelayMillis,
        );

        const proposalCommitment = proposalInclusionCommitmentForStatus(
          proofOutput.proposal,
          proofOutput.proposalIndex,
          proofOutput.proposalInclusionBlockInfo,
          GovProposalStatus.pending,
        );
        log("govExecuteUpdateIntent: proposalMap root", getRoot(privateInput.liveProposalMap));
        privateInput.liveProposalMap
          .get(proofOutput.proposalIndex)
          .assertEquals(proposalCommitment);

        const govUpdate = proofOutput.govSystemUpdate;
        applyGovernanceUpdates(publicInput, govUpdate);

        const executedCommitment = proposalInclusionCommitmentForStatus(
          proofOutput.proposal,
          proofOutput.proposalIndex,
          proofOutput.proposalInclusionBlockInfo,
          GovProposalStatus.executed,
        );
        privateInput.liveProposalMap.update(
          proofOutput.proposalIndex,
          executedCommitment,
        );
        publicInput.governanceState.proposalMapRoot = getRoot(
          privateInput.liveProposalMap,
        );

        return { publicOutput: publicInput };
      },
    },

    // make sure that it can be run either by validator or by governance
    blockCloseIntent: {
      privateInputs: [BlockCloseIntentPrivateInput],
      async method(
        publicInput: FizkRollupState,
        privateInput: BlockCloseIntentPrivateInput,
      ): Promise<{ publicOutput: FizkRollupState }> {
        log("blockCloseIntent: start");
        const previousStateHash: Field = Poseidon.hash(publicInput.toFields());

        log("blockCloseIntent: before oracle proof.verify");
        privateInput.oracleBlockDataProof.verify();
        log("blockCloseIntent: after oracle proof.verify");

        publicInput.vaultState.minaVaultTypeState.priceNanoUsd.previous =
          publicInput.vaultState.minaVaultTypeState.priceNanoUsd.current;
        publicInput.vaultState.minaVaultTypeState.priceNanoUsd.current =
          privateInput.oracleBlockDataProof.publicOutput.minaVaultTypeUpdate.priceNanoUsd;
        publicInput.vaultState.minaVaultTypeState.globalAccumulativeInterestRateScaled =
          privateInput.oracleBlockDataProof.publicOutput.minaVaultTypeUpdate.blockRateScaledUpdate;

        publicInput.vaultState.suiVaultTypeState.priceNanoUsd.previous =
          publicInput.vaultState.suiVaultTypeState.priceNanoUsd.current;
        publicInput.vaultState.suiVaultTypeState.priceNanoUsd.current =
          privateInput.oracleBlockDataProof.publicOutput.suiVaultTypeUpdate.priceNanoUsd;
        publicInput.vaultState.suiVaultTypeState.globalAccumulativeInterestRateScaled =
          privateInput.oracleBlockDataProof.publicOutput.suiVaultTypeUpdate.blockRateScaledUpdate;
        
        publicInput.fizkTokenState.fizkPriceNanoUsd.previous =
          publicInput.fizkTokenState.fizkPriceNanoUsd.current;
        publicInput.fizkTokenState.fizkPriceNanoUsd.current =
          privateInput.oracleBlockDataProof.publicOutput.fizkPriceNanoUsd;

        log("blockCloseIntent: updateBlockInfoState");
        updateBlockInfoState(
          privateInput.historicalStateMap as HistoricalBlockStateMap,
          privateInput.oracleBlockDataProof.publicOutput.timestamp,
          publicInput.blockInfoState,
          previousStateHash,
        );

        return { publicOutput: publicInput };
      },
    },
    
    // todo the computatiuon should properly deal with recision and scaling.
    // it should check the previous block price as well.
deficitCoverageLiquidation: { 
  privateInputs: [DeficitCoverageLiquidationPrivateInput],

  async method(
    publicInput: FizkRollupState,
    privateInput: DeficitCoverageLiquidationPrivateInput & {
      historicalBlockStateMap: HistoricalBlockStateMap,
      fizkTokenMap: FizkTokenMap,
      zkusdMap: ZkUsdMap,
      vaultMap: VaultMap,
    },
  ): Promise<{ publicOutput: FizkRollupState }> {
    const { vaultMap } = privateInput;

    // ----- Verify proof preconditions
    const preconditions: DeficitCoverageLiquidationPreconditions = privateInput.proof.publicInput;

    // you can use previous block price, but then you risk invalid intent if the price changes between the blocks
    const fizkPriceCurrent = publicInput.fizkTokenState.fizkPriceNanoUsd.current.equals(preconditions.fizkPriceNanoUsd);
    const fizkPricePrevious = publicInput.fizkTokenState.fizkPriceNanoUsd.previous.equals(preconditions.fizkPriceNanoUsd);
    const fizkPriceValid = fizkPriceCurrent.or(fizkPricePrevious);
    
    fizkPriceValid.assertTrue();

    const vaultTypeData = VaultMap.getVaultTypeData(
      publicInput.vaultState,
      privateInput.proof.publicOutput.collateralType
    );
    const collateralPriceCurrent = vaultTypeData.priceNanoUsd.current.equals(preconditions.collateralPriceNanoUsd);
    const collateralPricePrevious = vaultTypeData.priceNanoUsd.previous.equals(preconditions.collateralPriceNanoUsd);
    const collateralPriceValid = collateralPriceCurrent.or(collateralPricePrevious);
    collateralPriceValid.assertTrue();
    const collateralPriceNanoUsd = Provable.if(collateralPriceCurrent, vaultTypeData.priceNanoUsd.current, vaultTypeData.priceNanoUsd.previous);
    preconditions.vaultParameters.equals(vaultTypeData.parameters).assertTrue();

    verifyHistoricalBlockState(
      publicInput,
      privateInput.historicalBlockStateMap,
      preconditions.noteSnapshotBlockNumber,
      preconditions.noteSnapshotBlockHash,
    );

    // ----- Verify proof
    verifyDynamicProof(
      privateInput.proof,
      privateInput.proofVerification,
      publicInput.governanceState.rollupProgramsVkhMapRoot
    );

    // ----- Verify updates
    const repaymentUpdate = privateInput.proof.publicOutput.debtRepaymentUpdate;

    const {
      verifiedUpdate,
      liquidateeCollateralDelta,
      liquidatorCollateralDelta
    } = VaultMap.verifyLiquidationUpdate(
      vaultMap as VaultMap,
      publicInput.vaultState,
      repaymentUpdate
    );

    // ----- Fizk minting computation
    liquidateeCollateralDelta.assertEquals(UInt64.zero);

    const liquidationBonusRatio = vaultTypeData.parameters.liquidationBonusRatio;

    const shouldReceive = liquidatorCollateralDelta.value.mul(liquidationBonusRatio.value);
    const received = liquidatorCollateralDelta.value.mul(collateralPriceNanoUsd.value);

    const delta = received.sub(shouldReceive);

    // use proof price instead
    const fizkTokenAmount = delta.div(privateInput.proof.publicOutput.fizkPriceNanoUsd);
    fizkTokenAmount.assertLessThan(UInt50.maxint.value);

    const fizkMintUpdate = new FizkMintUpdate({
      amount: new UInt50({ value: fizkTokenAmount }),
      to: privateInput.proof.publicOutput.liquidatorAddress,
    });

    // ----- Continue with the rest of the updates
    getRoot(privateInput.fizkTokenMap).assertEquals(publicInput.fizkTokenState.fizkTokenMapRoot);

    const verifiedMintUpdate = FizkTokenMap.verifyMintUpdate(
      privateInput.fizkTokenMap,
      fizkMintUpdate
    );

    // Apply ZkUSD burn update
    const burnUpdate = privateInput.proof.publicOutput.zkusdBurnUpdate;
    const newZkusdMapRoot = ZkUsdMap.verifyAndUpdateSingleOutput(
      privateInput.zkusdMap,
      publicInput.zkUsdState.zkUsdMapRoot,
      burnUpdate
    );
    publicInput.zkUsdState.zkUsdMapRoot = newZkusdMapRoot;

    // Apply vault update
    const newVaultMapRoot = VaultMap.verifiedUpdate(vaultMap, verifiedUpdate);
    publicInput.vaultState.vaultMapRoot = newVaultMapRoot;

    // Apply Fizk mint update
    const newFizkTokenMapRoot = FizkTokenMap.applyVerifiedUpdates(
      privateInput.fizkTokenMap,
      verifiedMintUpdate,
      publicInput.blockInfoState.previousBlockClosureTimestamp,
      publicInput.governanceState.globalGovRewardIndex.current
    );
    publicInput.fizkTokenState.fizkTokenMapRoot = newFizkTokenMapRoot;

    return { publicOutput: publicInput };
  },
}
}});