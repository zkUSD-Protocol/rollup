import { SmartContract, state, State, Field, PublicKey, VerificationKey, Signature, Poseidon, method, DynamicProof, FeatureFlags, UInt64 } from "o1js";
import { BlockCommitment } from "../rollup/block-commitment.js";
import { IndexedMerkleMap } from "o1js/dist/node/lib/provable/merkle-tree-indexed.js";
import { BlockDataMap as BlockDataMapC } from "../domain/rollup/block-data-merkle-map-constants.js";

export class BlockProof extends DynamicProof<BlockCommitment, BlockCommitment> {
    static publicInputType = BlockCommitment;
    static publicOutputType = BlockCommitment;
    static maxProofsVerified = 0 as const;
    static featureFlags = FeatureFlags.allNone; // should allow block rollup program proofs
}

class BlockDataMap extends IndexedMerkleMap(BlockDataMapC.Height) {}

// this is a POC of the settlement contract.
// it shows the logic/sketch of settlement methods logic
export class SettlementContract extends SmartContract {
    @state (UInt64) blockNumber = State<UInt64>(UInt64.zero);
    @state (Field) stateCommitment = State<Field>(Field(0));
    @state (Field) lastBlockDataMerkleRoot = State<Field>(Field(0));
    
    /**
     * Settles the rollup state via permissioned key signature.
     * The signature is checked against the new proven rollup state.
     * 
     * @param nextBlockProof 
     * @param settlementAdminPublicKey 
     * @param verificationKey 
     * @param settlementSignature 
     * @param verificationDataMerkleMap 
     */
    @method
    async settleFizkRollupState(nextBlockProof: BlockProof, settlementAdminPublicKey: PublicKey, verificationKey: VerificationKey, settlementSignature: Signature, blockDataMap: BlockDataMap) {
        // verify block data map
        this.lastBlockDataMerkleRoot.requireEquals(blockDataMap.root);

        // the proof is valid and made by the authorized block rollup program.
        nextBlockProof.verify(verificationKey)
        const blockRollupVkh = blockDataMap.get(BlockDataMapC.RollupVkhKey);
        blockRollupVkh.assertEquals(verificationKey.hash);

        // the state was meant to be settled on this account
        const settlementContractAddressHash = blockDataMap.get(BlockDataMapC.SettlementContractAddressKey);
        Poseidon.hash(this.address.toFields()).assertEquals(settlementContractAddressHash);
        
        // check the signature
        const blockSettlementAdminPublicKeyHash = blockDataMap.get(BlockDataMapC.SettlementAdminPublicKeyMapKey);
        blockSettlementAdminPublicKeyHash.assertEquals(Poseidon.hash(settlementAdminPublicKey.toFields()));
        const message: Field[] = [...nextBlockProof.publicInput.toFields(), ...nextBlockProof.publicOutput.toFields()];
        settlementSignature.verify(settlementAdminPublicKey, message)

        // check the other inputs
        this.blockNumber.requireEquals(nextBlockProof.publicInput.blockNumber);
        this.stateCommitment.requireEquals(nextBlockProof.publicInput.rollupStateCommitment);
        this.lastBlockDataMerkleRoot.requireEquals(nextBlockProof.publicInput.blockDataMerkleRoot);

        // check input output relation
        nextBlockProof.publicInput.blockNumber.assertLessThan(nextBlockProof.publicOutput.blockNumber);

        // set the new state
        this.blockNumber.set(nextBlockProof.publicOutput.blockNumber);
        this.stateCommitment.set(nextBlockProof.publicOutput.rollupStateCommitment);
        this.lastBlockDataMerkleRoot.set(nextBlockProof.publicOutput.blockDataMerkleRoot);

        // emit event
        // todo 
    }

    @method
    async directEmergencySettlement(nextBlockProof: BlockProof, blockProofVK: VerificationKey, governanceDirectSettlementProof: BlockProof , governanceDirectSettlementProofVK:VerificationKey, settlementSignature: Signature, blockDataMap: BlockDataMap) {
        // verify block data map
        this.lastBlockDataMerkleRoot.requireEquals(blockDataMap.root);

        // the proof is valid and made by the authorized block rollup program.
        nextBlockProof.verify(blockProofVK)
        const blockRollupVkh = blockDataMap.get(BlockDataMapC.RollupVkhKey);
        blockRollupVkh.assertEquals(blockProofVK.hash);

        // the state was meant to be settled on this account
        const settlementContractAddressHash = blockDataMap.get(BlockDataMapC.SettlementContractAddressKey);
        Poseidon.hash(this.address.toFields()).assertEquals(settlementContractAddressHash);
        
        // verify the direct settlement
        governanceDirectSettlementProof.verify(governanceDirectSettlementProofVK);
        const governanceDirectSettlementProofVKH = blockDataMap.get(BlockDataMapC.DirectSettlementProgramVKH);
        governanceDirectSettlementProofVKH.assertEquals(governanceDirectSettlementProofVK.hash);
        governanceDirectSettlementProof.publicInput.equals(nextBlockProof.publicInput).assertTrue();
        governanceDirectSettlementProof.publicOutput.equals(nextBlockProof.publicOutput).assertTrue();

        // check the other inputs
        this.blockNumber.requireEquals(nextBlockProof.publicInput.blockNumber);
        this.stateCommitment.requireEquals(nextBlockProof.publicInput.rollupStateCommitment);
        this.lastBlockDataMerkleRoot.requireEquals(nextBlockProof.publicInput.blockDataMerkleRoot);

        // check input output relation
        nextBlockProof.publicInput.blockNumber.assertLessThan(nextBlockProof.publicOutput.blockNumber);

        // set the new state
        this.blockNumber.set(nextBlockProof.publicOutput.blockNumber);
        this.stateCommitment.set(nextBlockProof.publicOutput.rollupStateCommitment);
        this.lastBlockDataMerkleRoot.set(nextBlockProof.publicOutput.blockDataMerkleRoot);

        // emit event
        // todo 
    }
}