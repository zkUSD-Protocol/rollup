// import { Field, Provable, SelfProof, ZkProgram } from "o1js";
  
// // --- domain & intent imports (unchanged) -------------------------------------
// import { FizkRollupState } from "./domain/rollup-state.js";
// import { VaultParameters } from "./domain/vault/vault.js";
// import { CollateralType } from "./domain/vault/vault-collateral-type.js";
// import { CreateVaultComputationProof } from "./computation/create-vault.js";
// import { DepositCollateralComputationProof } from "./computation/deposit-collateral.js";
// import { RedeemCollateralComputationProof } from "./computation/redeem-collateral.js";
// import { BridgeOutComputationProof } from "./computation/bridge-out.js";
// import { BridgeInComputationProof } from "./computation/bridge-in.js";
// import { BurnComputationProof } from "./computation/burn.js";
// import { MintComputationProof } from "./computation/mint.js";
// import { LiquidateComputationProof } from "./computation/liquidate.js";
// import { TransferComputationProof } from "./computation/transfer.js";
// import { GovCreateProposalComputationProof } from "./computation/gov-create-proposal.js";
// import { GovVetoProposalComputationProof } from "./computation/gov-veto-proposal.js";
// import { GovExecuteUpdateComputationProof } from "./computation/gov-execute-update.js";
// import { BlockCloseComputationProof } from "./computation/block-close-intent.js";

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

// // -----------------------------------------------------------------------------
// // ZkProgram with logs
// // -----------------------------------------------------------------------------
// export const ZkusdRollup = ZkProgram({
//   name: "ZkusdRollup",
//   publicInput: Field,
//   publicOutput: Field,
//   methods: {
//     createVault: {
//       privateInputs: [CreateVaultComputationProof],
//       async method(
//         publicInput: Field,
//         proof: CreateVaultComputationProof,
//       ): Promise<{ publicOutput: Field }> {
//         proof.verify();
//         // assert inputs same
//         proof.publicInput.assertEquals(publicInput)
//         return { publicOutput: proof.publicOutput };
//       },
//     },
//    },
//    depositCollateral: {
//     privateInputs: [DepositCollateralComputationProof],
//     async method(
//       publicInput: Field,
//       proof: DepositCollateralComputationProof,
//     ): Promise<{ publicOutput: Field }> {
//       proof.verify();
//       // assert inputs same
//       proof.publicInput.assertEquals(publicInput)
//       return { publicOutput: proof.publicOutput };
//     },
//     redeemCollateral: {
//       privateInputs: [RedeemCollateralComputationProof],
//       async method(
//         publicInput: Field,
//         proof: RedeemCollateralComputationProof,
//       ): Promise<{ publicOutput: Field }> {
//         proof.verify();
//         // assert inputs same
//         proof.publicInput.assertEquals(publicInput)
//         return { publicOutput: proof.publicOutput };
//       },
//     },
//   },
//   bridgeOut: {
//     privateInputs: [BridgeOutComputationProof],
//     async method(
//       publicInput: Field,
//       proof: BridgeOutComputationProof,
//     ): Promise<{ publicOutput: Field }> {
//       proof.verify();
//       // assert inputs same
//       proof.publicInput.assertEquals(publicInput)
//       return { publicOutput: proof.publicOutput };
//     },
//   },
//   bridgeIn: {
//     privateInputs: [BridgeInComputationProof],
//     async method(
//       publicInput: Field,
//       proof: BridgeInComputationProof,
//     ): Promise<{ publicOutput: Field }> {
//       proof.verify();
//       // assert inputs same
//       proof.publicInput.assertEquals(publicInput)
//       return { publicOutput: proof.publicOutput };
//     },
//   },
//   burn: {
//     privateInputs: [BurnComputationProof],
//     async method(
//       publicInput: Field,
//       proof: BurnComputationProof,
//     ): Promise<{ publicOutput: Field }> {
//       proof.verify();
//       // assert inputs same
//       proof.publicInput.assertEquals(publicInput)
//       return { publicOutput: proof.publicOutput };
//     },
//   },
//   mint: {
//     privateInputs: [MintComputationProof],
//     async method(
//       publicInput: Field,
//       proof: MintComputationProof,
//     ): Promise<{ publicOutput: Field }> {
//       proof.verify();
//       // assert inputs same
//       proof.publicInput.assertEquals(publicInput)
//       return { publicOutput: proof.publicOutput };
//     },
//   },
//   liquidate: {
//     privateInputs: [LiquidateComputationProof],
//     async method(
//       publicInput: Field,
//       proof: LiquidateComputationProof,
//     ): Promise<{ publicOutput: Field }> {
//       proof.verify();
//       // assert inputs same
//       proof.publicInput.assertEquals(publicInput)
//       return { publicOutput: proof.publicOutput };
//     },
//   },
//   transfer: {
//     privateInputs: [TransferComputationProof],
//     async method(
//       publicInput: Field,
//       proof: TransferComputationProof,
//     ): Promise<{ publicOutput: Field }> {
//       proof.verify();
//       // assert inputs same
//       proof.publicInput.assertEquals(publicInput)
//       return { publicOutput: proof.publicOutput };
//     },
//   },
//   govCreateProposal: {
//     privateInputs: [GovCreateProposalComputationProof],
//     async method(
//       publicInput: Field,
//       proof: GovCreateProposalComputationProof,
//     ): Promise<{ publicOutput: Field }> {
//       proof.verify();
//       // assert inputs same
//       proof.publicInput.assertEquals(publicInput)
//       return { publicOutput: proof.publicOutput };
//     },
//   },
//   govVetoProposal: {
//     privateInputs: [GovVetoProposalComputationProof],
//     async method(
//       publicInput: Field,
//       proof: GovVetoProposalComputationProof,
//     ): Promise<{ publicOutput: Field }> {
//       proof.verify();
//       // assert inputs same
//       proof.publicInput.assertEquals(publicInput)
//       return { publicOutput: proof.publicOutput };
//     },
//   },
//   govExecuteUpdate: {
//     privateInputs: [GovExecuteUpdateComputationProof],
//     async method(
//       publicInput: Field,
//       proof: GovExecuteUpdateComputationProof,
//     ): Promise<{ publicOutput: Field }> {
//       proof.verify();
//       // assert inputs same
//       proof.publicInput.assertEquals(publicInput)
//       return { publicOutput: proof.publicOutput };
//     },
//   },
//   blockCloseIntent: {
//     privateInputs: [BlockCloseComputationProof],
//     async method(
//       publicInput: Field,
//       proof: BlockCloseComputationProof,
//     ): Promise<{ publicOutput: Field }> {
//       proof.verify();
//       // assert inputs same
//       proof.publicInput.assertEquals(publicInput)
//       return { publicOutput: proof.publicOutput };
//     },
//   },

//   merge: {
//     privateInputs: [SelfProof, SelfProof],
//     async method(
//       publicInput: Field,
//       proof1: SelfProof<Field, Field>,
//       proof2: SelfProof<Field, Field>,
//     ): Promise<{ publicOutput: Field }> {
//       proof1.verify();
//       proof2.verify();
//       // assert inputs same
//       proof1.publicInput.assertEquals(publicInput)
//       proof1.publicOutput.assertEquals(proof2.publicInput)
//       return { publicOutput: proof2.publicOutput };
//     },
//   },

// });

