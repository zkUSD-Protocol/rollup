import { Field, PublicKey, Signature, Struct, UInt32, UInt64, ZkProgram } from "o1js";
import { FizkTransferUpdate } from "../../domain/fizk-token/fizk-token-update";
import { FizkAddress } from "../../domain/fizk-token/fizk-address";
import { FizkMapValue } from "../../domain/fizk-token/fizk-map-value";
import { uint50toUint64 } from "../../core/uint50";
// preconditions

export class FizkTokenTransferPreconditions extends Struct({
    currentOperationNonce: UInt32,
}) {}



export class FizkTokenTransferPublicOutput extends Struct({
    fizkTransferUpdate: FizkTransferUpdate,
}) {}


export class CollectRewardsInput extends Struct({
    ownerPublicKey: PublicKey,
    signature: Signature,
}) {}


// export class FizkMapValue extends Struct({
//     amountUnstaked: UInt50,
//     amountStaked: UInt50,
//     amountPendingUnlock: UInt50,
//     globalGovRewardIndexSnapshot: UInt64,
//     unlockTimestamp: UInt32
// }) {

// todo: this is provisional sketch of the computation, we need to make it so that the integer division preserves the 
// precision we want
export function computeRewards(totalAmountStaked: UInt64, globalGovRewardIndexSnapshot: UInt64, amountStaked: UInt64, currentGlobalGovRewardIndex: UInt64): UInt64 {

    // the difference between the current and the snapshot global gov reward index
    // times the ratio of the amount staked to the total amount staked
    const globalGovRewardIndexDiff = currentGlobalGovRewardIndex.sub(globalGovRewardIndexSnapshot);
    const ratio = amountStaked.value.div(totalAmountStaked.value);
    const rewards = globalGovRewardIndexDiff.value.mul(ratio);
    // todo make sure that this is safe
    return UInt64.Unsafe.fromField(rewards);
}

// export function collectRewards(fizkMapValue: FizkMapValue, totalAmountStaked: UInt64, currentGlobalGovRewardIndex: UInt64): {newFizkMapValue: FizkMapValue, rewards: UInt64} {
    
//     // 
//     return {
//         newFizkMapValue: {
//             amountUnstaked: fizkMapValue.amountUnstaked,
//             amountStaked: fizkMapValue.amountStaked,
//             amountPendingUnlock: fizkMapValue.amountPendingUnlock,
//             globalGovRewardIndexSnapshot: currentGlobalGovRewardIndex,
//             unlockTimestamp: fizkMapValue.unlockTimestamp
//         },
//         rewards: computeRewards(fizkMapValue.globalGovRewardIndexSnapshot, fizkMapValue.amountStaked, currentGlobalGovRewardIndex, totalAmountStaked)
//     }
// }

