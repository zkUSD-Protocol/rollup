import {Field, Struct, PublicKey, Signature, UInt64, ZkProgram } from "o1js";
import { FizkTransferUpdate } from "../../domain/fizk-token/fizk-token-update";
import { FizkAddress } from "../../domain/fizk-token/fizk-address";
import { Note, OutputNoteCommitment } from "../../domain/zkusd/zkusd-note";
import { computeRewards } from "./common";
import { UInt50 } from "../../core/uint50";


// todo: because it is combined with stake altering intents it has this preconditions/ it has  to collect the rewards
// if we can we should move it out of the common wrapper, to make it mmore efficient and get rid of the preconditions.
export class FizkTransferPreconditions extends Struct({
    totalAmountStaked: UInt64,
    globalGovRewardIndexSnapshot: UInt64,
    amountStaked: UInt50, 
    currentGlobalGovRewardIndex: UInt64, 
}) {}

export class FizkTransferPrivateInput extends Struct({
    ownerPublicKey: PublicKey,
    amount: UInt50,
    signature: Signature,
    rewardOutputNote: Note,
    recipientAddress: FizkAddress,
}) {}

export class FizkTransferPublicOutput extends Struct({
    transferUpdate: FizkTransferUpdate,
    rewardOutputNoteCommitment: OutputNoteCommitment,
}) {}   



export const FizkTransferIntentKey = Field(10490054857078656466667304947102175670815779505166150894582302936733714274349n);


export const FizkTransfer = ZkProgram({
    name: 'fizk-transfer',
    publicInput: FizkTransferPreconditions,
    publicOutput: FizkTransferPublicOutput,
    methods: {
        transfer: {
            privateInputs: [FizkTransferPrivateInput],
            async method(publicInput: FizkTransferPreconditions, privateInput: FizkTransferPrivateInput): Promise<{ publicOutput: FizkTransferPublicOutput }> {
                // verify signature
                const address = FizkAddress.fromPublicKey(privateInput.ownerPublicKey);
                const message: Field[] = [
                    FizkTransferIntentKey,
                    address.value,
                    privateInput.amount.value,
                    privateInput.recipientAddress.value,
                ];

                privateInput.signature.verify(privateInput.ownerPublicKey, message);
                
                // compute rewards
                const rewards = computeRewards(publicInput.totalAmountStaked, publicInput.globalGovRewardIndexSnapshot, UInt50.toUInt64(publicInput.amountStaked), publicInput.currentGlobalGovRewardIndex);
                
                // check the rewards matches the note
                rewards.assertEquals(privateInput.rewardOutputNote.amount);

                return { publicOutput: {
                    transferUpdate: new FizkTransferUpdate({
                        from: address,
                        to: privateInput.recipientAddress,
                        amount: privateInput.amount,
                    }),
                    rewardOutputNoteCommitment: OutputNoteCommitment.create(privateInput.rewardOutputNote)
                } }
            }
        }
    }
})


export class FizkTransferProof extends ZkProgram.Proof(FizkTransfer) {}