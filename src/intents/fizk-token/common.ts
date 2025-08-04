import { Field, UInt64 } from "o1js";

export function computeRewards(totalAmountStaked: UInt64, globalGovRewardIndexSnapshot: UInt64, amountStaked: UInt64, currentGlobalGovRewardIndex: UInt64): UInt64 {
    const S = Field(BigInt(1e18));

    // the difference between the current and the snapshot global gov reward index
    // times the ratio of the amount staked to the total amount staked
    const globalGovRewardIndexDiff = currentGlobalGovRewardIndex.sub(globalGovRewardIndexSnapshot);
    const ratioScaled = amountStaked.value.mul(S).div(totalAmountStaked.value);
    const rewards = globalGovRewardIndexDiff.value.mul(ratioScaled).div(S);
    rewards.assertLessThanOrEqual(UInt64.MAXINT().value);
    return UInt64.Unsafe.fromField(rewards);
}