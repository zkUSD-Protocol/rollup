import { UInt64, Field, PublicKey, Signature, Struct, ZkProgram, Bool } from "o1js";
import { FizkModifyWithdrawalUpdate } from "../../domain/fizk-token/fizk-token-update.js";
import { Note, OutputNoteCommitment } from "../../domain/zkusd/zkusd-note.js";
import { UInt50 } from "../../core/uint50.js";
import { FizkAddress } from "../../domain/fizk-token/fizk-address.js";
import { computeRewards } from "./common.js";


export class FizkModifyWithdrawalIntentPreconditions extends Struct({
    totalAmountStaked: UInt64,
    globalGovRewardIndexSnapshot: UInt64,
    amountStaked: UInt64, 
    currentGlobalGovRewardIndex: UInt64, 
}) {}

// private input
export class FizkModifyWithdrawalIntentPrivateInput extends Struct({
    ownerPublicKey: PublicKey,
    amount: UInt50,
    isAdd: Bool,
    signature: Signature,
    outputNote: Note
}) {}


export class FizkModifyWithdrawalIntentPublicOutput extends Struct({
    modifyWithdrawalUpdate: FizkModifyWithdrawalUpdate,
    outputNoteCommitment: OutputNoteCommitment,
}) {}   


export const FizkModifyWithdrawalIntentKey = new Field(10390054857078656466667304947102175670815779505166150894582302936733714274349n);


export const FizkModifyWithdrawalIntent = ZkProgram({
    name: 'fizk-modify-withdrawal',
    publicInput: FizkModifyWithdrawalIntentPreconditions,
    publicOutput: FizkModifyWithdrawalIntentPublicOutput,
    methods: {
        modifyWithdrawal: {
            privateInputs: [FizkModifyWithdrawalIntentPrivateInput],
            async method(publicInput: FizkModifyWithdrawalIntentPreconditions, privateInput: FizkModifyWithdrawalIntentPrivateInput): Promise<{ publicOutput: FizkModifyWithdrawalIntentPublicOutput }> {
                // verify signature
                const address = FizkAddress.fromPublicKey(privateInput.ownerPublicKey);
                const message: Field[] = [
                    FizkModifyWithdrawalIntentKey,
                    address.value,
                    privateInput.isAdd.toField(),
                    privateInput.amount.value,
                ];

                privateInput.signature.verify(privateInput.ownerPublicKey, message);
                
                // compute rewards
                const rewards = computeRewards(publicInput.totalAmountStaked, publicInput.globalGovRewardIndexSnapshot, publicInput.amountStaked, publicInput.currentGlobalGovRewardIndex);
                
                // check the rewards matches the note
                rewards.assertEquals(privateInput.outputNote.amount);

                return { publicOutput: {
                    modifyWithdrawalUpdate: new FizkModifyWithdrawalUpdate({
                        target: address,
                        amount: privateInput.amount,
                        isAdd: privateInput.isAdd,
                    }),
                    outputNoteCommitment: OutputNoteCommitment.create(privateInput.outputNote)
                } };
            }
        }
    }
})

export class FizkModifyWithdrawalIntentProof extends ZkProgram.Proof(FizkModifyWithdrawalIntent) {}



