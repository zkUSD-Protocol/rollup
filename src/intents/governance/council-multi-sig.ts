import { Field, Gadgets, Provable, PublicKey, SelfProof, Signature, Struct, UInt64, UInt8, ZkProgram } from "o1js";
import { CouncilMemberMap } from "../../domain/governance/council-member-map.js";
import { getRoot, MerkleRoot } from "../../core/map/merkle-root.js";
import * as GovConstants from "../../domain/governance/constants.js";


export class GenericCouncilMultiSigPublicInput extends Struct({
    councilMemberMapRoot: MerkleRoot<CouncilMemberMap>,
    commitment: Field,
    lastValidBlockNumber: UInt64,
}) {}

export class GenericCouncilMultiSigOutput extends Struct({
    votesBitArray: Field,
}) {}

export class SingleVoteCouncilMultiSigPrivateInput extends Struct({
    councilMemberMap: CouncilMemberMap,
    seatPublicKey: PublicKey,
    signature: Signature,
    seatIndex: UInt8, // must be < 240
}) {}

export const GenericCouncilMultiSig = ZkProgram({
    name: 'GenericCouncilMultiSig',
    publicInput: GenericCouncilMultiSigPublicInput,
    publicOutput: GenericCouncilMultiSigOutput,
    methods: {
        singleVote: {
            privateInputs: [SingleVoteCouncilMultiSigPrivateInput],
            async method(publicInput: GenericCouncilMultiSigPublicInput, privateInput: SingleVoteCouncilMultiSigPrivateInput): Promise<{ publicOutput: GenericCouncilMultiSigOutput }> {
                // ensure that key is in the council
                getRoot(privateInput.councilMemberMap).assertEquals(publicInput.councilMemberMapRoot);
                const bitArrayValue = CouncilMemberMap.assertPubkeyIncluded(privateInput.councilMemberMap as CouncilMemberMap, privateInput.seatPublicKey, privateInput.seatIndex);
                
                // verify signature
                privateInput.signature.verify(privateInput.seatPublicKey, [publicInput.lastValidBlockNumber.value, publicInput.commitment]);

                const ret = new GenericCouncilMultiSigOutput({
                    votesBitArray: bitArrayValue.value,
                });
                
                return { publicOutput: ret };
            }
        },

        mergeVotes: {
            privateInputs: [SelfProof<GenericCouncilMultiSigPublicInput, GenericCouncilMultiSigOutput>, SelfProof<GenericCouncilMultiSigPublicInput, GenericCouncilMultiSigOutput>],
            async method(publicInput: GenericCouncilMultiSigPublicInput, proof1: SelfProof<GenericCouncilMultiSigPublicInput, GenericCouncilMultiSigOutput>, proof2: SelfProof<GenericCouncilMultiSigPublicInput, GenericCouncilMultiSigOutput>): Promise<{ publicOutput: GenericCouncilMultiSigOutput }> {

                proof1.verify();
                proof2.verify();

                const n = publicInput.lastValidBlockNumber;
                const n1 = proof1.publicInput.lastValidBlockNumber;
                const n2 = proof2.publicInput.lastValidBlockNumber;

                // last valid block number must be equal to the lower of the two
                n.assertEquals(Provable.if(n1.lessThan(n2), n1, n2));

                // the rest of the public inputs must be equal
                proof1.publicInput.commitment.assertEquals(proof2.publicInput.commitment);
                proof1.publicInput.councilMemberMapRoot.assertEquals(proof2.publicInput.councilMemberMapRoot);

                publicInput.commitment.assertEquals(proof1.publicInput.commitment);
                publicInput.councilMemberMapRoot.assertEquals(proof1.publicInput.councilMemberMapRoot);
                
                const votesSum = Gadgets.or(proof1.publicOutput.votesBitArray, proof2.publicOutput.votesBitArray, GovConstants.MAX_COUNCIL_SIZE);
                votesSum.assertLessThan(Field(GovConstants.MAX_COUNCIL_BIT_ARRAY_VOTE_VALUE));
                
                const ret = new GenericCouncilMultiSigOutput({
                    votesBitArray: votesSum,
                });
                
                return { publicOutput: ret };
            }
        }
    }
});
    
    


