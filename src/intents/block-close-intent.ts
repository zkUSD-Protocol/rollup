import {
  Field,
  Struct,
  UInt64,
  ZkProgram,
  DynamicProof,
  FeatureFlags,
} from 'o1js';
import { MerkleRoot } from "../core/map/merkle-root.js";
import { ObserverMap } from "../domain/enclave/observer-map.js";
import { HistoricalBlockStateMap } from "../domain/block-info/historical-block-state-map.js";
import { Timestamp } from "../core/timestamp.js";

export class BlockCloseIntentPreconditions extends Struct({
    
}) {}

export class BlockCloseIntentPublicOutput extends Struct({
    
}) {}

export const BlockCloseIntentKey = Field(24358148199980567763499829488488625916536864947877658593520562859562325813357n);


export const BlockCloseIntent = ZkProgram({
    name: 'BlockCloseIntent',
    publicInput: BlockCloseIntentPreconditions,
    publicOutput: BlockCloseIntentPublicOutput,
    methods: {
        dummy: {
            privateInputs: [],
            async method(publicInput: BlockCloseIntentPreconditions): Promise<{ publicOutput: BlockCloseIntentPublicOutput }> {
                return { publicOutput: publicInput };
            }
        }
    }
})

export class BlockCloseIntentProof extends ZkProgram.Proof(BlockCloseIntent) {}

const flags = FeatureFlags.allNone;
export class BlockCloseIntentDynamicProof extends DynamicProof<BlockCloseIntentPreconditions, BlockCloseIntentPublicOutput> {
  static publicInputType = BlockCloseIntentPreconditions;
  static publicOutputType = BlockCloseIntentPublicOutput;
  static maxProofsVerified = 0 as const;
  static featureFlags = flags;
}


export class OracleBlockDataProofPublicInput extends Struct({
    observersMerkleRoot: MerkleRoot<ObserverMap>,
}) {}

export class VaultTypeUpdate extends Struct({
    priceNanoUsd: UInt64,
    blockRateScaledUpdate:UInt64,
}) {
    toFields(): Field[] {
        return [
            this.priceNanoUsd.value,
            this.blockRateScaledUpdate.value,
        ];
    }

    static empty() {
        return new VaultTypeUpdate({
            priceNanoUsd: UInt64.zero,
            blockRateScaledUpdate: UInt64.zero,
        });
    }
}
    
export class OracleBlockDataProofPublicOutput extends Struct({
    minaVaultTypeUpdate: VaultTypeUpdate,
    suiVaultTypeUpdate: VaultTypeUpdate,
    fizkPriceNanoUsd: UInt64,
    timestamp: Timestamp,
}) {

    toFields(): Field[] {
        return [
            ...this.minaVaultTypeUpdate.toFields(),
            ...this.suiVaultTypeUpdate.toFields(),
            this.fizkPriceNanoUsd.value,
            ...this.timestamp.toFields(),
        ];
    }

    static empty() {
        return new OracleBlockDataProofPublicOutput({
            minaVaultTypeUpdate: VaultTypeUpdate.empty(),
            suiVaultTypeUpdate: VaultTypeUpdate.empty(),
            fizkPriceNanoUsd: UInt64.zero,
            timestamp: Timestamp.empty(),
        });
    }
}

export const OracleBlockDataProgram = ZkProgram({
    name: 'ObserverBlockDataProgram',
    publicInput: OracleBlockDataProofPublicInput,
    publicOutput: OracleBlockDataProofPublicOutput,
    methods: {
        dummy: {
            privateInputs: [],
            async method(_publicInput: OracleBlockDataProofPublicInput): Promise<{ publicOutput: OracleBlockDataProofPublicOutput }> {
                return { publicOutput: OracleBlockDataProofPublicOutput.empty() };
            }
        }
    }
})

export class OracleBlockDataProof extends ZkProgram.Proof(OracleBlockDataProgram) {}
