import { Bool, DynamicProof, FeatureFlags, Field, method, Poseidon, PublicKey, Signature, SmartContract, State, state, Struct, VerificationKey, ZkProgram } from "o1js";
import { IndexedMerkleMap } from "o1js/dist/node/lib/provable/merkle-tree-indexed";


export class FizkRollupState extends Struct({
    blockJustClosed: Bool,
    blockNumber: Field,

    // settlement authorization
    blockSettlementAdminPublicKeyHash: Field,
    directSettlementProgramVkh: Field, 
    settlementContractAddressHash: Field,

    // vkhs
    blockRollupVkh: Field,
    otherVkhMerkleRoot: Field,
    // others
}) {
    
}

export class FizkStateTransitionProof extends DynamicProof<FizkRollupState, FizkRollupState> {
    static publicInputType = FizkRollupState;
    static publicOutputType = FizkRollupState;
    static maxProofsVerified = 0 as const;
    static featureFlags = FeatureFlags.allNone;
}


function getRollupStateCommitment(state: FizkRollupState): Field {
    throw new Error('Not implemented');
    // return Poseidon.hash(state.toFields());
}

export class VkhMerkleMap extends IndexedMerkleMap(11) {}


export class BlockRollupProofState extends Struct({
    rollupStateCommitment: Field,
    blockNumber: Field,
    blockSettlementAdminPublicKeyHash: Field,
    directSettlementProgramVkh: Field, 
    settlementContractAddressHash: Field,
    blockRollupVkh: Field,
    otherVkhMerkleRoot: Field
}) {
    
}


export class BlockProofCommitment extends Struct({
    blockNumber: Field,
    rollupStateCommitment: Field,
}) {
    
}
 
export class DirectSettlementProof extends DynamicProof<BlockProofCommitment, BlockProofCommitment> {
    static publicInputType = BlockProofCommitment;
    static publicOutputType = BlockProofCommitment;
    static maxProofsVerified = 0 as const;
    static featureFlags = FeatureFlags.allNone;
}


export const BlockRollup = ZkProgram({
    name: 'block-rollup',
    publicInput: BlockRollupProofState,
    publicOutput: BlockRollupProofState,
    methods: {
        prove: {
            privateInputs: [FizkStateTransitionProof, VerificationKey, VkhMerkleMap],
            publicInput: BlockRollupProofState,
            async method(publicInput: BlockRollupProofState, privateInput: FizkStateTransitionProof, verificationKey: VerificationKey, vkhMap: VkhMerkleMap): Promise<{ publicOutput: BlockRollupProofState }> {
                privateInput.verify(verificationKey);
                vkhMap.assertIncluded(verificationKey.hash);
                vkhMap.root.assertEquals(publicInput.otherVkhMerkleRoot);
                privateInput.publicInput.blockJustClosed.assertEquals(Bool(true))
                
                // assert the input is matching the proof input
                privateInput.publicInput.blockNumber.assertEquals(publicInput.blockNumber)
                privateInput.publicInput.blockSettlementAdminPublicKeyHash.assertEquals(publicInput.blockSettlementAdminPublicKeyHash)
                privateInput.publicInput.directSettlementProgramVkh.assertEquals(publicInput.directSettlementProgramVkh)
                privateInput.publicInput.blockRollupVkh.assertEquals(publicInput.blockRollupVkh)
                privateInput.publicInput.otherVkhMerkleRoot.assertEquals(publicInput.otherVkhMerkleRoot)
                privateInput.publicInput.settlementContractAddressHash.assertEquals(publicInput.settlementContractAddressHash)

                // check state commitment
                getRollupStateCommitment(privateInput.publicInput).assertEquals(publicInput.rollupStateCommitment)

                // make the output in a similar way based on the proof output
                const newState = new BlockRollupProofState({
                    rollupStateCommitment: getRollupStateCommitment(privateInput.publicOutput),
                    blockNumber: privateInput.publicOutput.blockNumber,
                    blockSettlementAdminPublicKeyHash: privateInput.publicOutput.blockSettlementAdminPublicKeyHash,
                    directSettlementProgramVkh: privateInput.publicOutput.directSettlementProgramVkh,
                    settlementContractAddressHash: privateInput.publicOutput.settlementContractAddressHash,
                    blockRollupVkh: privateInput.publicOutput.blockRollupVkh,
                    otherVkhMerkleRoot: privateInput.publicOutput.otherVkhMerkleRoot,
                })
                return {    
                    publicOutput: newState
                }
            }
        }
    }
})

export class BlockProof extends DynamicProof<BlockRollupProofState, BlockRollupProofState> {
    static publicInputType = BlockRollupProofState;
    static publicOutputType = BlockRollupProofState;
    static maxProofsVerified = 0 as const;
    static featureFlags = FeatureFlags.allNone;
}


export class SettlementContract extends SmartContract {
    @state (Field) blockNumber = State<Field>(Field(0));
    @state (Field) stateCommitment = State<Field>(Field(0));
    @state (Field) blockSettlementAdminPublicKeyHash = State<Field>(Field(0));
    @state (Field) directSettlementProgramVkh = State<Field>(Field(0));
    @state (Field) blockRollupVkh = State<Field>(Field(0));
    @state (Field) otherVkhMerkleRoot = State<Field>(Field(0));   

    
    @method
    async settleFizkRollupState(proof: BlockProof, settlementAdminPublicKey: PublicKey, verificationKey: VerificationKey, settlementSignature: Signature) {
        // the proof is valid and made by the authorized block rollup program.
        proof.verify(verificationKey)
        this.blockRollupVkh.requireEquals(verificationKey.hash);
        // the state was meant to be settled on this account
        Poseidon.hash(this.address.toFields()).assertEquals(proof.publicOutput.settlementContractAddressHash);
        
        // check the signature
        this.blockSettlementAdminPublicKeyHash.requireEquals(Poseidon.hash(settlementAdminPublicKey.toFields()));
        const message = [proof.publicOutput.blockNumber, proof.publicOutput.rollupStateCommitment];
        settlementSignature.verify(settlementAdminPublicKey, message)

        // check the other inputs
        this.blockNumber.requireEquals(proof.publicInput.blockNumber);
        this.stateCommitment.requireEquals(proof.publicInput.rollupStateCommitment);
        //vkhs
        this.otherVkhMerkleRoot.requireEquals(proof.publicInput.otherVkhMerkleRoot);
        this.blockRollupVkh.requireEquals(proof.publicInput.blockRollupVkh);
        //others?

        // check input output relation
        proof.publicInput.blockNumber.assertLessThan(proof.publicOutput.blockNumber);

        // set the new state
        this.blockNumber.set(proof.publicOutput.blockNumber);
        this.stateCommitment.set(proof.publicOutput.rollupStateCommitment);
        this.blockSettlementAdminPublicKeyHash.set(proof.publicOutput.blockSettlementAdminPublicKeyHash);
        this.directSettlementProgramVkh.set(proof.publicOutput.directSettlementProgramVkh);
        this.blockRollupVkh.set(proof.publicOutput.blockRollupVkh);
        this.otherVkhMerkleRoot.set(proof.publicOutput.otherVkhMerkleRoot);

        // emit event
        // todo 
    }

    @method
    async directEmergencySettlement(proof: BlockProof, verificationKey: VerificationKey,  directSettlementProof: DirectSettlementProof, settlementVk: VerificationKey) {
        // the proof is valid and made by the authorized block rollup program.
        proof.verify(verificationKey)
        this.blockRollupVkh.requireEquals(verificationKey.hash);
        // the state was meant to be settled on this account
        Poseidon.hash(this.address.toFields()).assertEquals(proof.publicOutput.settlementContractAddressHash);
        
        // verify the direct settlement proof
        directSettlementProof.verify(settlementVk)
        this.directSettlementProgramVkh.requireEquals(settlementVk.hash)
        directSettlementProof.publicInput.blockNumber.assertEquals(proof.publicInput.blockNumber)
        directSettlementProof.publicInput.rollupStateCommitment.assertEquals(proof.publicInput.rollupStateCommitment)
        directSettlementProof.publicOutput.blockNumber.assertEquals(proof.publicOutput.blockNumber)
        directSettlementProof.publicOutput.rollupStateCommitment.assertEquals(proof.publicOutput.rollupStateCommitment)

        // check the other inputs
        this.blockNumber.requireEquals(proof.publicInput.blockNumber);
        this.stateCommitment.requireEquals(proof.publicInput.rollupStateCommitment);
        //vkhs
        this.otherVkhMerkleRoot.requireEquals(proof.publicInput.otherVkhMerkleRoot);
        this.blockRollupVkh.requireEquals(proof.publicInput.blockRollupVkh);
        //others?

        // check input output relation
        proof.publicInput.blockNumber.assertLessThan(proof.publicOutput.blockNumber);

        // set the new state
        this.blockNumber.set(proof.publicOutput.blockNumber);
        this.stateCommitment.set(proof.publicOutput.rollupStateCommitment);
        this.blockSettlementAdminPublicKeyHash.set(proof.publicOutput.blockSettlementAdminPublicKeyHash);
        this.directSettlementProgramVkh.set(proof.publicOutput.directSettlementProgramVkh);
        this.blockRollupVkh.set(proof.publicOutput.blockRollupVkh);
        this.otherVkhMerkleRoot.set(proof.publicOutput.otherVkhMerkleRoot);

        // emit event
        // todo 
    }
    
    
}
    


export class BlockCommitment extends Struct({
    blockNumber: Field,
    rollupStateCommitment: Field,
    verificationDataMerkleRoot: Field, // selected rollup fields made available via merkle map
}) {
    
}

export class BlockProof2 extends DynamicProof<BlockCommitment, BlockCommitment> {
    static publicInputType = BlockCommitment;
    static publicOutputType = BlockCommitment;
    static maxProofsVerified = 0 as const;
    static featureFlags = FeatureFlags.allNone;
}


export const BlockRollup2 = ZkProgram({
    name: 'block-rollup2',
    publicInput: BlockCommitment,
    publicOutput: BlockCommitment,
    methods: {
        prove: {
            privateInputs: [FizkStateTransitionProof, VerificationKey, VkhMerkleMap],
            publicInput: BlockCommitment,
            async method(publicInput: BlockCommitment, privateInput: FizkStateTransitionProof, verificationKey: VerificationKey, vkhMap: VkhMerkleMap): Promise<{ publicOutput: BlockCommitment }> {
                privateInput.verify(verificationKey);
                vkhMap.assertIncluded(verificationKey.hash);
                vkhMap.root.assertEquals(privateInput.publicInput.otherVkhMerkleRoot);
                privateInput.publicInput.blockJustClosed.assertEquals(Bool(true))
                
                // assert the input is matching the proof input
                privateInput.publicInput.blockNumber.assertEquals(publicInput.blockNumber)

                // check state commitment
                createVerificationDataMerkleRoot(privateInput.publicInput).assertEquals(publicInput.verificationDataMerkleRoot)
                getRollupStateCommitment(privateInput.publicInput).assertEquals(publicInput.rollupStateCommitment)

                // make the output in a similar way based on the proof output
                const newState = new BlockCommitment({
                    rollupStateCommitment: getRollupStateCommitment(privateInput.publicOutput),
                    blockNumber: privateInput.publicOutput.blockNumber,
                    verificationDataMerkleRoot: createVerificationDataMerkleRoot(privateInput.publicOutput),
                })
                return {    
                    publicOutput: newState
                }
            }
        }
    }
})

 
export class DirectSettlementProof2 extends DynamicProof<BlockCommitment, BlockCommitment> {
    static publicInputType = BlockCommitment;
    static publicOutputType = BlockCommitment;
    static maxProofsVerified = 0 as const;
    static featureFlags = FeatureFlags.allNone;
}
function createVerificationDataMerkleRoot(state: FizkRollupState): Field {
    throw new Error('Not implemented');
}


class VerificationDataMerkleMap extends IndexedMerkleMap(12) {
    
}


    const blockSettlementAdminPublicKeyHashMapKey = new Field(0) 
    const directSettlementProgramVkhHashMapKey = new Field(1) 
    const blockRollupVkhHashMapKey = new Field(2) 
    const otherVkhMerkleRootHashMapKey = new Field(3)   
    const settlementContractAddressHashMapKey = new Field(4)


export class SettlementContract2 extends SmartContract {
    @state (Field) blockNumber = State<Field>(Field(0));
    @state (Field) stateCommitment = State<Field>(Field(0));
    @state (Field) verificationDataMerkleRoot = State<Field>(Field(0));

    
    @method
    async settleFizkRollupState(proof: BlockProof2, settlementAdminPublicKey: PublicKey, verificationKey: VerificationKey, settlementSignature: Signature, verificationDataMerkleMap: VerificationDataMerkleMap) {
        // the proof is valid and made by the authorized block rollup program.
        proof.verify(verificationKey)
        const blockRollupVkh = verificationDataMerkleMap.get(blockRollupVkhHashMapKey)
        blockRollupVkh.assertEquals(verificationKey.hash);
        // the state was meant to be settled on this account
        const settlementContractAddressHash = verificationDataMerkleMap.get(settlementContractAddressHashMapKey)
        Poseidon.hash(this.address.toFields()).assertEquals(settlementContractAddressHash);
        
        // check the signature
        const blockSettlementAdminPublicKeyHash = verificationDataMerkleMap.get(blockSettlementAdminPublicKeyHashMapKey)
        blockSettlementAdminPublicKeyHash.assertEquals(Poseidon.hash(settlementAdminPublicKey.toFields()));
        const message = [proof.publicOutput.blockNumber, proof.publicOutput.rollupStateCommitment];
        settlementSignature.verify(settlementAdminPublicKey, message)

        // check the other inputs
        this.blockNumber.requireEquals(proof.publicInput.blockNumber);
        this.stateCommitment.requireEquals(proof.publicInput.rollupStateCommitment);
        this.verificationDataMerkleRoot.requireEquals(proof.publicInput.verificationDataMerkleRoot);

        // check input output relation
        proof.publicInput.blockNumber.assertLessThan(proof.publicOutput.blockNumber);

        // set the new state
        this.blockNumber.set(proof.publicOutput.blockNumber);
        this.stateCommitment.set(proof.publicOutput.rollupStateCommitment);
        this.verificationDataMerkleRoot.set(proof.publicOutput.verificationDataMerkleRoot);

        // emit event
        // todo 
    }

    @method
    async directEmergencySettlement(proof: BlockProof2, verificationKey: VerificationKey,  directSettlementProof: DirectSettlementProof2, settlementVk: VerificationKey) {
        // similarly
    }
}