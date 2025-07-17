// import { Field, Poseidon, Provable, Struct, UInt64, ZkProgram } from "o1js";
  


// // --- domain & intent imports (unchanged) -------------------------------------
// import { FizkRollupState } from "./domain/rollup-state.js";
// import { BlockCloseIntentPrivateInput } from "./intents/block-close-intent.js";
// import { HistoricalBlockStateMap } from "./domain/block-info/historical-block-state-map.js";
// import { BlockInfoState } from "./domain/block-info/block-info-state.js";
// import {
//   proposalInclusionCommitmentForStatus,
//   GovActionType,
//   GovProposalStatus,
//   GovActionIntentProof,
//   GovSystemUpdate,
// } from "./intents/governance/wrapper.js";
// import { ProposalMap } from "./domain/governance/proposal-map.js";
// import { Timestamp } from "./core/timestamp.js";
// import { CreateVaultIntentProof } from "./intents/create-vault.js";
// import { VaultMap } from "./domain/vault/vault-map.js";
// import { VaultParameters } from "./domain/vault/vault.js";
// import { CollateralType } from "./domain/vault/vault-collateral-type.js";
// import { DepositIntentProof } from "./intents/deposit.js";
// import { CollateralIoMap } from "./domain/bridging/collateral-io-map.js";
// import { CollateralIOAccumulators } from "./domain/bridging/collateral-io-accumulators.js";
// import { RedeemIntentProof } from "./intents/redeem.js";
// import { TransferIntentProof } from "./intents/transfer.js";
// import { ZkUsdMap } from "./domain/zkusd/zkusd-map.js";
// import { BurnIntentProof } from "./intents/burn.js";
// import { MintIntentProof } from "./intents/mint.js";
// import { BridgeIntentProof } from "./intents/bridge.js";
// import { BridgeIoMap } from "./domain/bridging/bridge-io-map.js";
// import { BridgeMap } from "./domain/bridging/bridge-map.js";
// import { ObserverMap } from "./domain/enclave/observer-map.js";
// import { BridgeInIntentProof } from "./intents/bridge-back.js";
// import { getRoot } from "./core/map/merkle-root.js";
// import { LiquidateIntentProof } from "./intents/liquidate.js";
// import { RedeemCollateralUpdate } from "./domain/vault/vault-update.js";

// // -----------------------------------------------------------------------------
// // Utility helpers (untouched except logging replacements)
// // -----------------------------------------------------------------------------
// function log(msg: string, v?: unknown) {
// Provable.log(msg);
// }
// function getActualVaultParams(
//   publicInput: FizkRollupState,
//   collateralType: CollateralType,
// ): VaultParameters {
//   return Provable.if(
//     collateralType.equals(CollateralType.SUI),
//     publicInput.vaultState.suiVaultTypeState.parameters,
//     publicInput.vaultState.minaVaultTypeState.parameters,
//   );
// }

// function applyGovernanceUpdates(
//   rollupState: FizkRollupState,
//   govUpdate: GovSystemUpdate,
// ): void {
//   rollupState.vaultState.minaVaultTypeState.parameters = Provable.if(
//     govUpdate.applyMinaVaultParamsUpdate,
//     govUpdate.minaVaultParamsUpdate,
//     rollupState.vaultState.minaVaultTypeState.parameters,
//   );

//   rollupState.vaultState.suiVaultTypeState.parameters = Provable.if(
//     govUpdate.applySuiVaultParamsUpdate,
//     govUpdate.suiVaultParamsUpdate,
//     rollupState.vaultState.suiVaultTypeState.parameters,
//   );

//   rollupState.zkUsdEnclavesState = Provable.if(
//     govUpdate.applyEnclaveStateUpdate,
//     govUpdate.enclaveStateUpdate,
//     rollupState.zkUsdEnclavesState,
//   );

//   rollupState.globalParametersState = Provable.if(
//     govUpdate.applyGlobalParametersStateUpdate,
//     govUpdate.globalParametersStateUpdate,
//     rollupState.globalParametersState,
//   );

//   rollupState.governanceState = Provable.if(
//     govUpdate.applyGovernanceStateUpdate,
//     rollupState.governanceState.applyUpdate(govUpdate.governanceStateUpdate),
//     rollupState.governanceState,
//   );

//   rollupState.regulatoryState = Provable.if(
//     govUpdate.applyRegulatoryStateUpdate,
//     govUpdate.regulatoryStateUpdate,
//     rollupState.regulatoryState,
//   );
// }

// function updateBlockInfoState(
//   historicalStateTree: HistoricalBlockStateMap,
//   timestamp: Timestamp,
//   blockInfoState: BlockInfoState,
//   previousStateHash: Field,
// ): void {
//   blockInfoState.blockNumber = blockInfoState.blockNumber.add(1);
//   blockInfoState.previousBlockClosureTimestamp = timestamp;
//   blockInfoState.intentSequence = blockInfoState.intentSequence.add(1);
//   historicalStateTree.insert(blockInfoState.blockNumber.sub(1).value, previousStateHash);
// }

// function verifyProposalSnapshot(
//   historicalBlockStateMap: HistoricalBlockStateMap,
//   snapshotState: FizkRollupState,
//   currentBlockInfo: BlockInfoState,
//   snapshotValidityMillis: UInt64,
// ): void {
//   historicalBlockStateMap.root.assertEquals(
//     currentBlockInfo.historicalStateMerkleRoot.root,
//   );
//   const snapshotHash = Poseidon.hash(snapshotState.toFields());
//   log("verifyProposalSnapshot: map root", historicalBlockStateMap.root);
//   historicalBlockStateMap
//     .get(snapshotState.blockInfoState.blockNumber.value)
//     .assertEquals(snapshotHash);
//   Poseidon.hash(snapshotState.toFields()).assertEquals(snapshotHash);
//   const snapshotTimestamp = snapshotState.blockInfoState.previousBlockClosureTimestamp;
//   const currentTimestamp = currentBlockInfo.previousBlockClosureTimestamp;
//   currentTimestamp.isGreaterThanBy(snapshotTimestamp, snapshotValidityMillis).assertFalse();
// }

// // -----------------------------------------------------------------------------
// // Structs (unchanged)
// // -----------------------------------------------------------------------------
// export class GovExecuteUpdatePrivateInput extends Struct({
//   proof: GovActionIntentProof,
//   liveProposalMap: ProposalMap,
// }) {}


// export class GovCreateProposalPrivateInput extends Struct({
// 	proof: GovActionIntentProof,
// 	liveProposalMap: ProposalMap,
// 	proposalSnapshotState: FizkRollupState,
// 	historicalBlockStateMap: HistoricalBlockStateMap,
// }) {}

// export class GovVetoProposalPrivateInput extends Struct({
// 	proof: GovActionIntentProof,
// 	liveProposalMap: ProposalMap,
// 	proposalSnapshotState: FizkRollupState,
// 	historicalBlockStateMap: HistoricalBlockStateMap,
// }) {}


// export class CreateVaultPrivateInput extends Struct({
// 	proof: CreateVaultIntentProof,
// 	vaultMap: VaultMap,
// 	iomap: CollateralIoMap,
// }) {}

// export class DepositPrivateInput extends Struct({
// 	proof: DepositIntentProof,
// 	vaultMap: VaultMap,
// 	iomap: CollateralIoMap,
// }) {}

// export class RedeemPrivateInput extends Struct({
// 	proof: RedeemIntentProof,
// 	vaultMap: VaultMap,
// 	iomap: CollateralIoMap,
// }) {}

// export class TransferPrivateInput extends Struct({
// 	historicalBlockStateMap: HistoricalBlockStateMap,
// 	zkusdMap: ZkUsdMap,
// 	proof: TransferIntentProof,
// }) {}

// export class BurnPrivateInput extends Struct({
// 	proof: BurnIntentProof,
// 	zkusdMap: ZkUsdMap,
// 	vaultMap: VaultMap,
// 	historicalBlockStateMap: HistoricalBlockStateMap,
// }) {}

// export class LiquidatePrivateInput extends Struct({
// 	proof: LiquidateIntentProof,
// 	zkusdMap: ZkUsdMap,
// 	vaultMap: VaultMap,
// 	collateralIoMap: CollateralIoMap,
// 	historicalBlockStateMap: HistoricalBlockStateMap,
// }) {}
// export class MintPrivateInput extends Struct({
// 	proof: MintIntentProof,
// 	zkusdMap: ZkUsdMap,
// 	vaultMap: VaultMap,
// 	historicalBlockStateMap: HistoricalBlockStateMap,
// }) {}
// export class BridgeOutPrivateInput extends Struct({
// 	proof: BridgeIntentProof,
// 	bridgeMap: BridgeMap,
// 	zkusdMap: ZkUsdMap,
// 	bridgeIoMap: BridgeIoMap,
// 	historicalBlockStateMap: HistoricalBlockStateMap,
// }) {}

// export class BridgeInPrivateInput extends Struct({
// 	proof: BridgeInIntentProof,
// 	observerMap: ObserverMap,
// 	zkusdMap: ZkUsdMap,
// 	bridgeIoMap: BridgeIoMap,
// }) {}

// // -----------------------------------------------------------------------------
// // ZkProgram with logs
// // -----------------------------------------------------------------------------
// export const ZkusdRollup = ZkProgram({
//   name: "ZkusdRollup",
//   publicInput: FizkRollupState,
//   publicOutput: FizkRollupState,
//   methods: {
//     createVault: {
//       privateInputs: [CreateVaultPrivateInput],
//       async method(
//         publicInput: FizkRollupState,
//         privateInput: CreateVaultPrivateInput & {
//           proof: CreateVaultIntentProof;
//           vaultMap: VaultMap;
//           iomap: CollateralIoMap;
//         },
//       ): Promise<{ publicOutput: FizkRollupState }> {
//         log("createVault: start");
//         log("createVault: before proof.verify");
//         privateInput.proof.verify();
//         log("createVault: after proof.verify");

//         log("createVault: verify vault update");
//         const verifiedVaultUpdate = VaultMap.verifyCreateVaultUpdate(
//           privateInput.vaultMap,
//           publicInput.vaultState,
//           privateInput.proof.publicOutput.update,
//         );

//         const ioMap = privateInput.iomap;
//         getRoot(ioMap).assertEquals(publicInput.vaultState.collateralIoMapRoot);
//         ioMap.insert(
//           privateInput.proof.publicOutput.update.vaultAddress.key,
//           CollateralIOAccumulators.empty().pack(),
//         );
//         publicInput.vaultState.collateralIoMapRoot = getRoot(ioMap);

//         log("createVault: updating VaultMap");
//         const vaultMap = privateInput.vaultMap;
//         const newVaultMapRoot = VaultMap.verifiedInsert(
//           vaultMap,
//           verifiedVaultUpdate,
//         );
//         publicInput.vaultState.vaultMapRoot = newVaultMapRoot;

//         return { publicOutput: publicInput };
//       },
//     },

//     depositCollateral: {
//       privateInputs: [DepositPrivateInput],
//       async method(
//         publicInput: FizkRollupState,
//         privateInput: DepositPrivateInput & {
//           vaultMap: VaultMap;
//           iomap: CollateralIoMap;
//         },
//       ): Promise<{ publicOutput: FizkRollupState }> {
//         log("depositCollateral: start");
//         log("depositCollateral: before proof.verify");
//         privateInput.proof.verify();
//         log("depositCollateral: after proof.verify");

//         const update = privateInput.proof.publicOutput.update;
//         const preconditions = privateInput.proof.publicInput;
//         const actualVaultParams = getActualVaultParams(
//           publicInput,
//           update.collateralType,
//         );
//         preconditions.vaultParameters.equals(actualVaultParams).assertTrue();
//         preconditions.observerKeysMerkleRoot.assertEquals(
//           publicInput.zkUsdEnclavesState.observerKeysMerkleRoot,
//         );

//         const ioMap = privateInput.iomap;
//         getRoot(ioMap).assertEquals(publicInput.vaultState.collateralIoMapRoot);

//         log("depositCollateral: verify vault update");
//         const verifiedVaultUpdate = VaultMap.verifyDepositCollateralUpdate(
//           privateInput.vaultMap,
//           publicInput.vaultState,
//           update,
//         );

//         log("depositCollateral: verify & update io map");
//         const verifiedIoUpdate = CollateralIoMap.verifyDeposit(ioMap, update);
//         publicInput.vaultState.collateralIoMapRoot = CollateralIoMap.verifiedUpdate(
//           ioMap,
//           verifiedIoUpdate,
//         );

//         log("depositCollateral: update VaultMap root");
//         const vaultMap = privateInput.vaultMap;
//         publicInput.vaultState.vaultMapRoot = VaultMap.verifiedUpdate(
//           vaultMap,
//           verifiedVaultUpdate,
//         );

// 		log("depositCollateral: end");
//         return { publicOutput: publicInput };
//       },
//     },

//     redeemCollateral: {
//       privateInputs: [RedeemPrivateInput],
//       async method(
//         publicInput: FizkRollupState,
//         privateInput: RedeemPrivateInput & {
//           vaultMap: VaultMap;
//           iomap: CollateralIoMap;
//         },
//       ): Promise<{ publicOutput: FizkRollupState }> {
//         log("redeemCollateral: before proof.verify");
//         privateInput.proof.verify();
//         log("redeemCollateral: after proof.verify");

//         const update = privateInput.proof.publicOutput.update;
//         const preconditions = privateInput.proof.publicInput;
//         const actualVaultParams = getActualVaultParams(
//           publicInput,
//           update.collateralType,
//         );
//         preconditions.vaultParameters.equals(actualVaultParams).assertTrue();

//         const iomap = privateInput.iomap;
//         getRoot(iomap).assertEquals(publicInput.vaultState.collateralIoMapRoot);

//         log("redeemCollateral: verify vault update");
//         const verifiedVaultUpdate = VaultMap.verifyRedeemCollateralUpdate(
//           privateInput.vaultMap,
//           publicInput.vaultState,
//           update,
//         );

//         log("redeemCollateral: verify & update io map");
//         const verifiedIoUpdate = CollateralIoMap.verifyWithdraw(iomap, update);
//         publicInput.vaultState.collateralIoMapRoot = CollateralIoMap.verifiedUpdate(
//           iomap,
//           verifiedIoUpdate,
//         );

//         log("redeemCollateral: update VaultMap root");
//         publicInput.vaultState.vaultMapRoot = VaultMap.verifiedUpdate(
//           privateInput.vaultMap,
//           verifiedVaultUpdate,
//         );

//         return { publicOutput: publicInput };
//       },
//     },

//     bridgeOut: {
//       privateInputs: [BridgeOutPrivateInput],
//       async method(
//         publicInput: FizkRollupState,
//         privateInput: BridgeOutPrivateInput & {
//           zkusdMap: ZkUsdMap;
//           bridgeIoMap: BridgeIoMap;
//           bridgeMap: BridgeMap;
//           historicalBlockStateMap: HistoricalBlockStateMap;
//         },
//       ): Promise<{ publicOutput: FizkRollupState }> {
//         log("bridgeOut: before proof.verify");
//         privateInput.proof.verify();
//         log("bridgeOut: after proof.verify");

//         const preconditions = privateInput.proof.publicInput;
//         getRoot(privateInput.historicalBlockStateMap).assertEquals(
//           publicInput.blockInfoState.historicalStateMerkleRoot,
//         );
//         log("bridgeOut: historicalStateMap root", privateInput.historicalBlockStateMap.root);
//         privateInput.historicalBlockStateMap
//           .get(preconditions.noteSnapshotBlockNumber.value)
//           .assertEquals(preconditions.noteSnapshotBlockHash);
//         preconditions.noteSnapshotBlockNumber.assertLessThanOrEqual(
//           publicInput.blockInfoState.blockNumber,
//         );
//         getRoot(privateInput.bridgeMap).assertEquals(
//           publicInput.zkUsdState.bridgeIoMapRoot,
//         );

//         log("bridgeOut: verify BridgeIoMap update");
//         const verifiedIoMapUpdate = BridgeIoMap.verifyBridgeSendIntent(
//           privateInput.bridgeIoMap,
//           privateInput.proof.publicOutput.bridgeIntentUpdate,
//         );

//         log("bridgeOut: update ZkUsdMap");
//         const newZkusdMapRoot = ZkUsdMap.verifyAndUpdate(
//           privateInput.zkusdMap,
//           publicInput.zkUsdState,
//           privateInput.proof.publicOutput.zkusdMapUpdate,
//         );
//         publicInput.zkUsdState.zkUsdMapRoot = newZkusdMapRoot;

//         log("bridgeOut: update BridgeIoMap root");
//         publicInput.zkUsdState.bridgeIoMapRoot = BridgeIoMap.verifiedSet(
//           privateInput.bridgeIoMap,
//           verifiedIoMapUpdate,
//         );

//         log("bridgeOut: end");

//         return { publicOutput: publicInput };
//       },
//     },

//     bridgeIn: {
//       privateInputs: [BridgeInPrivateInput],
//       async method(
//         publicInput: FizkRollupState,
//         privateInput: BridgeInPrivateInput & {
//           zkusdMap: ZkUsdMap;
//           bridgeIoMap: BridgeIoMap;
//           observerMap: ObserverMap;
//         },
//       ): Promise<{ publicOutput: FizkRollupState }> {
//         log("bridgeIn: before proof.verify");
//         privateInput.proof.verify();
//         log("bridgeIn: after proof.verify");

//         privateInput.proof.publicOutput.observersSignedCount.assertGreaterThanOrEqual(
//           publicInput.governanceState.observersMultiSigTreshold,
//         );

//         const bridgedAddress =
//           privateInput.proof.publicOutput.bridgeIntentUpdate.bridgedAddress;

//         getRoot(privateInput.zkusdMap).assertEquals(
//           publicInput.zkUsdState.zkUsdMapRoot,
//         );
//         getRoot(privateInput.bridgeIoMap).assertEquals(
//           publicInput.zkUsdState.bridgeIoMapRoot,
//         );

//         log("bridgeIn: verify observerKeysMerkleRoot");
//         const preconditions = privateInput.proof.publicInput;
//         publicInput.zkUsdEnclavesState.observerKeysMerkleRoot.assertEquals(
//           preconditions.observerMapRoot,
//         );

//         log("bridgeIn: verify BridgeIoMap accumulators");
//         const actualAccumulators = BridgeIoMap.getAccumulators(
//           privateInput.bridgeIoMap,
//           bridgedAddress,
//         );
//         actualAccumulators.totalMinted.assertEquals(
//           preconditions.totalAmountBridgedIn,
//         );

//         log("bridgeIn: verify BridgeIoMap receive update");
//         const verifiedIoMapUpdate = BridgeIoMap.verifyBridgeReceiveIntent(
//           privateInput.bridgeIoMap,
//           privateInput.proof.publicOutput.bridgeIntentUpdate,
//         );

//         log("bridgeIn: update ZkUsdMap");
//         const newZkusdMapRoot = ZkUsdMap.verifyAndUpdate(
//           privateInput.zkusdMap,
//           publicInput.zkUsdState,
//           privateInput.proof.publicOutput.zkusdMapUpdate,
//         );
//         publicInput.zkUsdState.zkUsdMapRoot = newZkusdMapRoot;

//         log("bridgeIn: update BridgeIoMap root");
//         publicInput.zkUsdState.bridgeIoMapRoot = BridgeIoMap.verifiedSet(
//           privateInput.bridgeIoMap,
//           verifiedIoMapUpdate,
//         );
        
//         log("bridgeIn: end");

//         return { publicOutput: publicInput };
//       },
//     },

//     burn: {
//       privateInputs: [BurnPrivateInput],
//       async method(
//         publicInput: FizkRollupState,
//         privateInput: BurnPrivateInput & { zkusdMap: ZkUsdMap; vaultMap: VaultMap },
//       ): Promise<{ publicOutput: FizkRollupState }> {
//         log("burn: before proof.verify");
//         privateInput.proof.verify();
//         log("burn: after proof.verify");

//         const preconditions = privateInput.proof.publicInput;
//         const vaultUpdate = privateInput.proof.publicOutput.vaultUpdate;
//         const actualVaultParams = getActualVaultParams(
//           publicInput,
//           vaultUpdate.collateralType,
//         );
//         preconditions.vaultParameters.equals(actualVaultParams).assertTrue();

//         getRoot(privateInput.historicalBlockStateMap).assertEquals(
//           publicInput.blockInfoState.historicalStateMerkleRoot,
//         );
//         log("burn: historicalBlockStateMap root", privateInput.historicalBlockStateMap.root);
//         privateInput.historicalBlockStateMap
//           .get(preconditions.noteSnapshotBlockNumber.value)
//           .assertEquals(preconditions.noteSnapshotBlockHash);
//         preconditions.noteSnapshotBlockNumber.assertLessThanOrEqual(
//           publicInput.blockInfoState.blockNumber,
//         );

//         log("burn: verify VaultMap repay update");
//         const verifiedVaultUpdate = VaultMap.verifyRepayDebtUpdate(
//           privateInput.vaultMap,
//           publicInput.vaultState,
//           vaultUpdate,
//         );

//         log("burn: update ZkUsdMap");
//         const newZkusdMapRoot = ZkUsdMap.verifyAndUpdate(
//           privateInput.zkusdMap,
//           publicInput.zkUsdState,
//           privateInput.proof.publicOutput.zkusdMapUpdate,
//         );
//         publicInput.zkUsdState.zkUsdMapRoot = newZkusdMapRoot;

//         log("burn: update VaultMap root");
//         publicInput.vaultState.vaultMapRoot = VaultMap.verifiedUpdate(
//           privateInput.vaultMap,
//           verifiedVaultUpdate,
//         );
//         log("burn: end");

//         return { publicOutput: publicInput };
//       },
//     },
 
//     liquidate: {
//       privateInputs: [LiquidatePrivateInput],
//       async method(
//         publicInput: FizkRollupState,
//         privateInput: LiquidatePrivateInput & { zkusdMap: ZkUsdMap; vaultMap: VaultMap; collateralIoMap: CollateralIoMap },
//       ): Promise<{ publicOutput: FizkRollupState }> {
//         log("liquidate: before proof.verify");
//         privateInput.proof.verify();
//         log("liquidate: after proof.verify");

//         const preconditions = privateInput.proof.publicInput;
//         const vaultUpdate = privateInput.proof.publicOutput.vaultDebtRepayment;
//         const actualVaultParams = getActualVaultParams(
//           publicInput,
//           vaultUpdate.collateralType,
//         );
//         preconditions.vaultParameters.equals(actualVaultParams).assertTrue();

//         getRoot(privateInput.historicalBlockStateMap).assertEquals(
//           publicInput.blockInfoState.historicalStateMerkleRoot,
//         );
//         log("liquidate: historicalBlockStateMap root", privateInput.historicalBlockStateMap.root);
//         privateInput.historicalBlockStateMap
//           .get(preconditions.noteSnapshotBlockNumber.value)
//           .assertEquals(preconditions.noteSnapshotBlockHash);
//         preconditions.noteSnapshotBlockNumber.assertLessThanOrEqual(
//           publicInput.blockInfoState.blockNumber,
//         );

//         // create iomap update based on the liquidation logic
//         log("liquidate: verify VaultMap liquidation update");
//         const { liquidateeCollateralDelta, liquidatorCollateralDelta, verifiedUpdate } = VaultMap.verifyLiquidationUpdate(
//           privateInput.vaultMap,
//           publicInput.vaultState,
//           vaultUpdate,
//         );
        
//         // verify redeem collateral update
//         log("liquidate: verify CollateralIoMap liquidatee update");
//         const verifiedLiquidateeUpdate = CollateralIoMap.verifyWithdraw(
//           privateInput.collateralIoMap,
//           new RedeemCollateralUpdate({
//             vaultAddress: vaultUpdate.vaultAddress,
//             collateralDelta: liquidateeCollateralDelta,
//             collateralType: vaultUpdate.collateralType,
//           }),
//         );

//         // verify liquidator redeem collateral update
//         log("liquidate: verify CollateralIoMap liquidator update");
//         const verifiedLiquidatorUpdate = CollateralIoMap.verifyWithdraw(
//           privateInput.collateralIoMap,
//           new RedeemCollateralUpdate({
//             vaultAddress: privateInput.proof.publicOutput.liquidatorVaultAddress,
//             collateralDelta: liquidatorCollateralDelta,
//             collateralType: vaultUpdate.collateralType,
//           }),
//         );

//         log("liquidate: update ZkUsdMap root");
//         const newZkusdMapRoot = ZkUsdMap.verifyAndUpdateSingleOutput(
//           privateInput.zkusdMap,
//           publicInput.zkUsdState,
//           privateInput.proof.publicOutput.zkusdBurnUpdate,
//         );
//         publicInput.zkUsdState.zkUsdMapRoot = newZkusdMapRoot;

//         log("liquidate: update VaultMap root");
//         publicInput.vaultState.vaultMapRoot = VaultMap.verifiedUpdate(
//           privateInput.vaultMap,
//           verifiedUpdate,
//         );

//         // apply the rest of the updates
//         log("liquidate: update CollateralIoMap root");
//         publicInput.vaultState.vaultMapRoot = VaultMap.verifiedUpdate(
//           privateInput.vaultMap,
//           verifiedUpdate,
//         );

//         log("liquidate: update CollateralIoMap root");
//         publicInput.vaultState.collateralIoMapRoot = CollateralIoMap.verifiedUpdate(
//           privateInput.collateralIoMap,
//           verifiedLiquidateeUpdate,
//         );
//         // assert equal roots / TODO can be removed later
//         getRoot(privateInput.collateralIoMap).assertEquals(publicInput.vaultState.collateralIoMapRoot);

//         publicInput.vaultState.collateralIoMapRoot = CollateralIoMap.verifiedUpdate(
//           privateInput.collateralIoMap,
//           verifiedLiquidatorUpdate,
//         );

//         log("liquidate: end");
//         return { publicOutput: publicInput };
//       },
//     },

//     mint: {
//       privateInputs: [MintPrivateInput],
//       async method(
//         publicInput: FizkRollupState,
//         privateInput: MintPrivateInput & {
//           zkusdMap: ZkUsdMap;
//           vaultMap: VaultMap;
//           historicalBlockStateMap: HistoricalBlockStateMap;
//         },
//       ): Promise<{ publicOutput: FizkRollupState }> {
//         log("mint: before proof.verify");
//         privateInput.proof.verify();
//         log("mint: after proof.verify");

//         const vaultUpdate = privateInput.proof.publicOutput.vaultUpdate;
//         const currentBlockNumber = publicInput.blockInfoState.blockNumber;
//         const priceBlockNumber = privateInput.proof.publicInput.rollupStateBlockNumber;

//         const collateralPriceNanoUsd = Provable.if(
//           vaultUpdate.collateralType.equals(CollateralType.SUI),
//           publicInput.vaultState.suiVaultTypeState.priceNanoUsd,
//           publicInput.vaultState.minaVaultTypeState.priceNanoUsd,
//         );

//         const currentStateCondition = currentBlockNumber
//           .equals(priceBlockNumber)
//           .and(
//             privateInput.proof.publicInput.collateralPriceNanoUsd.equals(
//               collateralPriceNanoUsd,
//             ),
//           );

//         log("mint: historicalBlockStateMap root", privateInput.historicalBlockStateMap.root);
//         const previousBlockStateHash = privateInput.historicalBlockStateMap.get(
//           priceBlockNumber.value,
//         );

//         const previousStateCondition = currentBlockNumber
//           .sub(1)
//           .equals(priceBlockNumber)
//           .and(
//             previousBlockStateHash.equals(
//               privateInput.proof.publicInput.rollupStateHash,
//             )
//           );

//         currentStateCondition.or(previousStateCondition).assertTrue();

//         log("mint: verify VaultMap mint update");
//         const verifiedVaultUpdate = VaultMap.verifyMintUpdate(
//           privateInput.vaultMap,
//           publicInput.vaultState,
//           vaultUpdate,
//         );

//         log("mint: update ZkUsdMap");
//         const newZkusdMapRoot = ZkUsdMap.verifyAndUpdate(
//           privateInput.zkusdMap,
//           publicInput.zkUsdState,
//           privateInput.proof.publicOutput.zkusdMapUpdate,
//         );
//         publicInput.zkUsdState.zkUsdMapRoot = newZkusdMapRoot;

//         log("mint: update VaultMap root");
//         publicInput.vaultState.vaultMapRoot = VaultMap.verifiedUpdate(
//           privateInput.vaultMap,
//           verifiedVaultUpdate,
//         );

//         return { publicOutput: publicInput };
//       },
//     },

//     transfer: {
//       privateInputs: [TransferPrivateInput],
//       async method(
//         publicInput: FizkRollupState,
//         privateInput: TransferPrivateInput & {
//           zkusdMap: ZkUsdMap;
//           historicalBlockStateMap: HistoricalBlockStateMap;
//         },
//       ): Promise<{ publicOutput: FizkRollupState }> {
//         log("transfer: before proof.verify");
//         privateInput.proof.verify();
//         log("transfer: after proof.verify");

//         const { noteSnapshotBlockNumber, noteSnapshotBlockHash } =
//           privateInput.proof.publicInput;

//         getRoot(privateInput.historicalBlockStateMap).assertEquals(
//           publicInput.blockInfoState.historicalStateMerkleRoot,
//         );
//         log("transfer: historicalBlockStateMap root", privateInput.historicalBlockStateMap.root);
//         privateInput.historicalBlockStateMap
//           .get(noteSnapshotBlockNumber.value)
//           .assertEquals(noteSnapshotBlockHash);
//         noteSnapshotBlockNumber.assertLessThanOrEqual(
//           publicInput.blockInfoState.blockNumber,
//         );

//         log("transfer: update ZkUsdMap");
//         const newZkusdMapRoot = ZkUsdMap.verifyAndUpdate(
//           privateInput.zkusdMap,
//           publicInput.zkUsdState,
//           privateInput.proof.publicOutput.zkusdMapUpdate,
//         );
//         publicInput.zkUsdState.zkUsdMapRoot = newZkusdMapRoot;

//         return { publicOutput: publicInput };
//       },
//     },

//     govCreateProposal: {
//       privateInputs: [GovCreateProposalPrivateInput],
//       async method(
//         publicInput: FizkRollupState,
//         privateInput: GovCreateProposalPrivateInput & {
//           historicalBlockStateMap: HistoricalBlockStateMap;
//           liveProposalMap: ProposalMap;
//         },
//       ): Promise<{ publicOutput: FizkRollupState }> {
//         log("govCreateProposal: before proof.verify");
//         privateInput.proof.verify();
//         log("govCreateProposal: after proof.verify");

//         verifyProposalSnapshot(
//           privateInput.historicalBlockStateMap,
//           privateInput.proposalSnapshotState,
//           publicInput.blockInfoState,
//           publicInput.governanceState.proposalSnapshotValidityMillis,
//         );

//         publicInput.governanceState.proposalMapRoot.assertEquals(
//           getRoot(privateInput.liveProposalMap),
//         );

//         const proposalIndex = publicInput.governanceState.lastProposalIndex.add(1);
//         publicInput.governanceState.lastProposalIndex = proposalIndex;

//         const pendingProposalCommitment = proposalInclusionCommitmentForStatus(
//           privateInput.proof.publicOutput.proposal,
//           proposalIndex,
//           publicInput.blockInfoState,
//           GovProposalStatus.pending,
//         );
//         privateInput.liveProposalMap.insert(
//           proposalIndex,
//           pendingProposalCommitment,
//         );
//         publicInput.governanceState.proposalMapRoot = getRoot(
//           privateInput.liveProposalMap,
//         );

//         return { publicOutput: publicInput };
//       },
//     },

//     govVetoProposal: {
//       privateInputs: [GovVetoProposalPrivateInput],
//       async method(
//         publicInput: FizkRollupState,
//         privateInput: GovVetoProposalPrivateInput & { liveProposalMap: ProposalMap },
//       ): Promise<{ publicOutput: FizkRollupState }> {
//         log("govVetoProposal: before proof.verify");
//         privateInput.proof.verify();
//         log("govVetoProposal: after proof.verify");

//         privateInput.proof.publicOutput.govActionType.assertEquals(
//           GovActionType.vetoProposal,
//         );

//         verifyProposalSnapshot(
//           privateInput.historicalBlockStateMap as HistoricalBlockStateMap,
//           privateInput.proposalSnapshotState,
//           publicInput.blockInfoState,
//           publicInput.governanceState.proposalSnapshotValidityMillis,
//         );

//         publicInput.governanceState.proposalMapRoot.assertEquals(
//           getRoot(privateInput.liveProposalMap),
//         );

//         const proposalIndex = privateInput.proof.publicOutput.proposalIndex;
//         const proposalInclusionBlockInfo =
//           privateInput.proof.publicOutput.proposalInclusionBlockInfo;
//         const pendingProposalCommitment = proposalInclusionCommitmentForStatus(
//           privateInput.proof.publicOutput.proposal,
//           proposalIndex,
//           proposalInclusionBlockInfo,
//           GovProposalStatus.pending,
//         );
//         log("govVetoProposal: proposalMap root", getRoot(privateInput.liveProposalMap));
//         privateInput.liveProposalMap
//           .get(proposalIndex)
//           .assertEquals(pendingProposalCommitment);

//         const vetoedCommitment = proposalInclusionCommitmentForStatus(
//           privateInput.proof.publicOutput.proposal,
//           proposalIndex,
//           proposalInclusionBlockInfo,
//           GovProposalStatus.vetoed,
//         );
//         privateInput.liveProposalMap.update(proposalIndex, vetoedCommitment);
//         publicInput.governanceState.proposalMapRoot = getRoot(
//           privateInput.liveProposalMap,
//         );

//         return { publicOutput: publicInput };
//       },
//     },

//     govExecuteUpdateIntent: {
//       privateInputs: [GovExecuteUpdatePrivateInput],
//       async method(
//         publicInput: FizkRollupState,
//         privateInput: GovExecuteUpdatePrivateInput & { liveProposalMap: ProposalMap },
//       ): Promise<{ publicOutput: FizkRollupState }> {
//         log("govExecuteUpdateIntent: before proof.verify");
//         privateInput.proof.verify();
//         log("govExecuteUpdateIntent: after proof.verify");

//         const proofOutput = privateInput.proof.publicOutput;
//         proofOutput.govActionType.assertEquals(GovActionType.executeUpdate);

//         getRoot(privateInput.liveProposalMap).assertEquals(
//           publicInput.governanceState.proposalMapRoot,
//         );

//         const proposalCreationTimestamp =
//           proofOutput.proposalInclusionBlockInfo.previousBlockClosureTimestamp;
//         const currentTimestamp =
//           publicInput.blockInfoState.previousBlockClosureTimestamp;
//         proposalCreationTimestamp.isGreaterThanBy(
//           currentTimestamp,
//           publicInput.governanceState.proposalExecutionDelayMillis,
//         );

//         const proposalCommitment = proposalInclusionCommitmentForStatus(
//           proofOutput.proposal,
//           proofOutput.proposalIndex,
//           proofOutput.proposalInclusionBlockInfo,
//           GovProposalStatus.pending,
//         );
//         log("govExecuteUpdateIntent: proposalMap root", getRoot(privateInput.liveProposalMap));
//         privateInput.liveProposalMap
//           .get(proofOutput.proposalIndex)
//           .assertEquals(proposalCommitment);

//         const govUpdate = proofOutput.govSystemUpdate;
//         applyGovernanceUpdates(publicInput, govUpdate);

//         const executedCommitment = proposalInclusionCommitmentForStatus(
//           proofOutput.proposal,
//           proofOutput.proposalIndex,
//           proofOutput.proposalInclusionBlockInfo,
//           GovProposalStatus.executed,
//         );
//         privateInput.liveProposalMap.update(
//           proofOutput.proposalIndex,
//           executedCommitment,
//         );
//         publicInput.governanceState.proposalMapRoot = getRoot(
//           privateInput.liveProposalMap,
//         );

//         return { publicOutput: publicInput };
//       },
//     },

//     blockCloseIntent: {
//       privateInputs: [BlockCloseIntentPrivateInput],
//       async method(
//         publicInput: FizkRollupState,
//         privateInput: BlockCloseIntentPrivateInput,
//       ): Promise<{ publicOutput: FizkRollupState }> {
//         log("blockCloseIntent: start");
//         const previousStateHash: Field = Poseidon.hash(publicInput.toFields());

//         log("blockCloseIntent: before oracle proof.verify");
//         privateInput.oracleBlockDataProof.verify();
//         log("blockCloseIntent: after oracle proof.verify");

//         publicInput.vaultState.minaVaultTypeState.priceNanoUsd =
//           privateInput.oracleBlockDataProof.publicOutput.minaVaultTypeUpdate.priceNanoUsd;
//         publicInput.vaultState.minaVaultTypeState.globalAccumulativeInterestRateScaled =
//           privateInput.oracleBlockDataProof.publicOutput.minaVaultTypeUpdate.blockRateScaledUpdate;

//         publicInput.vaultState.suiVaultTypeState.priceNanoUsd =
//           privateInput.oracleBlockDataProof.publicOutput.suiVaultTypeUpdate.priceNanoUsd;
//         publicInput.vaultState.suiVaultTypeState.globalAccumulativeInterestRateScaled =
//           privateInput.oracleBlockDataProof.publicOutput.suiVaultTypeUpdate.blockRateScaledUpdate;

//         log("blockCloseIntent: updateBlockInfoState");
//         updateBlockInfoState(
//           privateInput.historicalStateMap as HistoricalBlockStateMap,
//           privateInput.oracleBlockDataProof.publicOutput.timestamp,
//           publicInput.blockInfoState,
//           previousStateHash,
//         );

//         return { publicOutput: publicInput };
//       },
//     }, 
//    },
// });