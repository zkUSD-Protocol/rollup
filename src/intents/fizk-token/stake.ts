import {Field, Struct, PublicKey, Signature, UInt64, ZkProgram } from "o1js";
import { FizkAddStakeUpdate } from "../../domain/fizk-token/fizk-token-update";
import { FizkAddress } from "../../domain/fizk-token/fizk-address";
import { Note, OutputNoteCommitment } from "../../domain/zkusd/zkusd-note";
import { computeRewards } from "./common";
import { UInt50 } from "../../core/uint50";


export class FizkAddStakePreconditions extends Struct({
    totalAmountStaked: UInt64,
    globalGovRewardIndexSnapshot: UInt64,
    amountStaked: UInt64, 
    currentGlobalGovRewardIndex: UInt64, 
}) {}

export class FizkAddStakePrivateInput extends Struct({
    ownerPublicKey: PublicKey,
    amount: UInt50,
    signature: Signature,
    outputNote: Note
}) {}

export class FizkAddStakePublicOutput extends Struct({
    addStakeUpdate: FizkAddStakeUpdate,
    outputNoteCommitment: OutputNoteCommitment,
}) {}   



export const FizkAddStakeIntentKey = Field(10390054857078656466667304947102175670815779505166150894582302936733714274349n);

// this inntents move fizk from unstaked to staked position
// it collects reward
export const FizkAddStake = ZkProgram({
    name: 'fizk-add-stake',
    publicInput: FizkAddStakePreconditions,
    publicOutput: FizkAddStakePublicOutput,
    methods: {
        addStake: {
            privateInputs: [FizkAddStakePrivateInput],
            async method(publicInput: FizkAddStakePreconditions, privateInput: FizkAddStakePrivateInput): Promise<{ publicOutput: FizkAddStakePublicOutput }> {
                // verify signature
                const address = FizkAddress.fromPublicKey(privateInput.ownerPublicKey);
                const message: Field[] = [
                    FizkAddStakeIntentKey,
                    address.value,
                    privateInput.amount.value,
                ];

                privateInput.signature.verify(privateInput.ownerPublicKey, message);
                
                // compute rewards
                const rewards = computeRewards(publicInput.totalAmountStaked, publicInput.globalGovRewardIndexSnapshot, publicInput.amountStaked, publicInput.currentGlobalGovRewardIndex);
                
                // check the rewards matches the note
                rewards.assertEquals(privateInput.outputNote.amount);

                return { publicOutput: {
                    addStakeUpdate: new FizkAddStakeUpdate({
                        to: address,
                        amount: privateInput.amount,
                    }),
                    outputNoteCommitment: OutputNoteCommitment.create(privateInput.outputNote)
                } }
            }
        }
    }
})


export class FizkAddStakeProof extends ZkProgram.Proof(FizkAddStake) {}