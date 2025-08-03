import { UInt64, Field, PublicKey, Signature, Struct, ZkProgram, Bool } from "o1js";
import { FizkWithdrawUnlockedUpdate } from "../../domain/fizk-token/fizk-token-update.js";
import { Note, OutputNoteCommitment } from "../../domain/zkusd/zkusd-note.js";
import { FizkAddress } from "../../domain/fizk-token/fizk-address.js";
import { computeRewards } from "./common.js";
import { Ratio32 } from "../../core/ratio.js";


export class FizkWithdrawUnlockedIntentPreconditions extends Struct({
    totalAmountStaked: UInt64,
    globalGovRewardIndexSnapshot: UInt64,
    amountStaked: UInt64, 
    currentGlobalGovRewardIndex: UInt64,
    stakeWithdrawalFee: Ratio32,
}) {}

// private input
export class FizkWithdrawUnlockedIntentPrivateInput extends Struct({
    ownerPublicKey: PublicKey,
    signature: Signature,
    outputNote: Note
}) {}


export class FizkWithdrawUnlockedIntentPublicOutput extends Struct({
    withdrawUnlockedUpdate: FizkWithdrawUnlockedUpdate,
    outputNoteCommitment: OutputNoteCommitment,
}) {}   


export const FizkWithdrawUnlockedIntentKey = new Field(10390054852078656463667304967102175670835779525166150894582302936733714274349n);


export const FizkWithdrawUnlockedIntent = ZkProgram({
    name: 'fizk-withdraw-unlocked',
    publicInput: FizkWithdrawUnlockedIntentPreconditions,
    publicOutput: FizkWithdrawUnlockedIntentPublicOutput,
    methods: {
        withdrawUnlocked: {
            privateInputs: [FizkWithdrawUnlockedIntentPrivateInput],
            async method(publicInput: FizkWithdrawUnlockedIntentPreconditions, privateInput: FizkWithdrawUnlockedIntentPrivateInput): Promise<{ publicOutput: FizkWithdrawUnlockedIntentPublicOutput }> {
                // verify signature
                const address = FizkAddress.fromPublicKey(privateInput.ownerPublicKey);
                const message: Field[] = [
                    FizkWithdrawUnlockedIntentKey,
                    address.value,
                ];

                privateInput.signature.verify(privateInput.ownerPublicKey, message);
                
                // compute rewards
                const rewards = computeRewards(publicInput.totalAmountStaked, publicInput.globalGovRewardIndexSnapshot, publicInput.amountStaked, publicInput.currentGlobalGovRewardIndex);
                
                // check the rewards matches the note
                rewards.assertEquals(privateInput.outputNote.amount);

                return { publicOutput: {
                    withdrawUnlockedUpdate: new FizkWithdrawUnlockedUpdate({
                        target: address,
                    }),
                    outputNoteCommitment: OutputNoteCommitment.create(privateInput.outputNote)
                } };
            }
        }
    }
})

export class FizkWithdrawUnlockedIntentProof extends ZkProgram.Proof(FizkWithdrawUnlockedIntent) {}



