import { Field, Struct } from "o1js";

export class Pcrs extends Struct( {
    //for now
    pcrs: [Field,Field,Field,Field,Field,Field]
}){}
    


// *** Enclave

// observerPcrs - 3 sha254 hashes = 6 fields
// validatorPcrs
// orchestratorPcrs
// intentSponsorPcrs
// 24 fields

// observerKeyMerkleList
// validatorKeyMerkleList
// orchestratorKeyMerkleList
// intentSponsorKeyMerkleList
// 4 fields
