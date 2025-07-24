import { Field, Struct } from "o1js";

export class FizkStateSettlementAuthorization extends Struct({
    blockSettlementAdminPublicKeyHash: Field,
    directSettlementProgramVkh: Field, 
    settlementContractAddressHash: Field, // the rollup publishes its intented settlement contract address.
}) {
    
    toFields() : Field[] {
        return [
            this.blockSettlementAdminPublicKeyHash,
            this.directSettlementProgramVkh,
            this.settlementContractAddressHash,
        ];
    }
    
}

export class RollupLogicVerification extends Struct({
    blockRollupVkh: Field,
    otherVkhMerkleRoot: Field,
}) {
   
    toFields() : Field[] {
        return [
            this.blockRollupVkh,
            this.otherVkhMerkleRoot,
        ];
    }
}

export class RollupVerificationState extends Struct({
    stateSettlementAuthorization: FizkStateSettlementAuthorization,
    rollupLogicVerification:RollupLogicVerification
}) {

    toFields() : Field[] {
        return [
            ...this.stateSettlementAuthorization.toFields(),
            ...this.rollupLogicVerification.toFields(),
        ];
    }
    
}