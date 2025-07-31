import { Bool, Field, Poseidon, PrivateKey, Provable, PublicKey, Signature, Struct, UInt32, ZkProgram } from "o1js";
import { ObserverMap } from "../domain/enclave/observer-map.js";
import { getRoot, MerkleRoot } from "../core/map/merkle-root.js";
import { BridgeIoAccumulators } from "../domain/bridging/bridge-io-accumulators.js";
import { BridgedAddress } from "../domain/bridging/bridged-address.js";
import { BridgeCode } from "../domain/bridging/bridge.js";


export class ObserverBridgeStateAttestationPayload extends Struct({
    bridgedAddress: BridgedAddress,
    bridgeStateAccumulators: BridgeIoAccumulators,
    bridgeCode: BridgeCode,
    observerPublicKey: PublicKey,
}) {

    toFields(): Field[] {
        return [
            ...this.bridgedAddress.key.toFields(),
            ...this.bridgeStateAccumulators.toFields(),
            ...this.bridgeCode.value.toFields(),
            ...this.observerPublicKey.toFields(),
        ];
    }
    
    static empty(): ObserverBridgeStateAttestationPayload {
        return new ObserverBridgeStateAttestationPayload({
            bridgedAddress: BridgedAddress.empty(),
            bridgeStateAccumulators: BridgeIoAccumulators.empty(),
            bridgeCode: BridgeCode.empty(),
            observerPublicKey: PublicKey.empty(),
        });
    }
}


export class ObserverBridgeSetateAttestation extends Struct({
    payload: ObserverBridgeStateAttestationPayload,
    signature: Signature,
    notDummy: Bool,
}) {

    toFields(): Field[] {
        return [
            ...this.payload.toFields(),
            ...this.signature.toFields(),
            new Field(this.notDummy.value),
        ];
    }

}

const MAX_OBSERVERS_ATTESTATIONS = 9;

export class ObserverBridgeSetateAttestations extends Struct({
    attestations: Provable.Array(ObserverBridgeSetateAttestation, MAX_OBSERVERS_ATTESTATIONS),
}) {};



export class ZkusdBridgeStatePublicInput extends Struct({
    observerMapRoot: MerkleRoot<ObserverMap>,
    bridgedAddress: BridgedAddress,
}) {};

export class ZkusdBridgeStatePublicOutput extends Struct({
    bridgeCode: BridgeCode,
    provenBridgeStateAccumulators: BridgeIoAccumulators,
    observersSigned: UInt32,
}) {};

export class ZkusdBridgeStatePrivateInput extends Struct({
    bridgeCode: BridgeCode,
    observerMap: ObserverMap,
    bridgeStateAccumulatorsToProve: BridgeIoAccumulators,
    attestations: ObserverBridgeSetateAttestations,
}) {};


const dummyPayload = ObserverBridgeStateAttestationPayload.empty()
// is there a better way to get always valid signatures
const {privateKey: dummyPrivateKey, publicKey: dummyPublicKey} = PrivateKey.randomKeypair()
const dummySignature = Signature.create(dummyPrivateKey, dummyPayload.toFields());   


export const ZkusdBridgeState = ZkProgram({
    name: 'ZkusdBridgeState',
    publicInput: ZkusdBridgeStatePublicInput,
    publicOutput: ZkusdBridgeStatePublicOutput,
    privateInputs: [ZkusdBridgeStatePrivateInput],
    methods: {
        proveBridgeAccumulators: {
            privateInputs: [ZkusdBridgeStatePrivateInput],
            async method(
                publicInput: ZkusdBridgeStatePublicInput,
                privateInput: ZkusdBridgeStatePrivateInput & { observerMap: ObserverMap }
            ): Promise<{ publicOutput: ZkusdBridgeStatePublicOutput }> {
                const { observerMap, bridgeStateAccumulatorsToProve } = privateInput;
                const { observerMapRoot } = publicInput;
                
                // observer map root must match
                observerMapRoot.assertEquals(getRoot(observerMap));
                
                // for each provided attestation
                let validSignatureCount = UInt32.zero;
                for (let i = 0; i < MAX_OBSERVERS_ATTESTATIONS; i++) {
                    const attestation = privateInput.attestations.attestations[i];
                    const { signature, notDummy } = attestation;
                    
                    // verify signature if not dummy
                    const signedPayload = Provable.if(notDummy, attestation.payload, dummyPayload);
                    const observerPublicKey = Provable.if(notDummy, attestation.payload.observerPublicKey, dummyPublicKey);
                    signature.verify(observerPublicKey, signedPayload.toFields());

                    // verify values higher or equal to intended
                    const isHigherOrEqual = notDummy.and(
                        bridgeStateAccumulatorsToProve.totalBurned.lessThanOrEqual(attestation.payload.bridgeStateAccumulators.totalBurned).and(
                            bridgeStateAccumulatorsToProve.totalMinted.lessThanOrEqual(attestation.payload.bridgeStateAccumulators.totalMinted)
                        )
                    );
                    
                    // bridge code must match
                    const doesBridgeCodeMatch = notDummy.and(
                        attestation.payload.bridgeCode.value.equals(privateInput.bridgeCode.value)
                    );

                    // bridged address must match
                    const doesBridgedAddressMatch = notDummy.and(
                        attestation.payload.bridgedAddress.key.equals(publicInput.bridgedAddress.key)
                    );

                    // observer must be in observer map
                    const observerInMap = notDummy.and(
                        observerMap.getOption(Poseidon.hash(attestation.payload.observerPublicKey.toFields())).isSome
                    );  

                    // increment valid signature count
                    validSignatureCount = Provable.if(notDummy.and(isHigherOrEqual.and(doesBridgedAddressMatch).and(observerInMap).and(doesBridgeCodeMatch)), validSignatureCount.add(UInt32.one), validSignatureCount);

                    
                }
                
                return {
                    publicOutput: {
                        provenBridgeStateAccumulators: bridgeStateAccumulatorsToProve,
                        observersSigned: validSignatureCount,
                        bridgeCode: privateInput.bridgeCode,
                    },
                };
            },
        },
    },
}); 

export class ObserverBridgeStateAttestationProof extends ZkProgram.Proof(ZkusdBridgeState) {};