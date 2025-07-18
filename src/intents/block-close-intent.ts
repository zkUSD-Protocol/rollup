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

export class BlockCloseIntentPublicInput extends Struct({
    
}) {}

export class BlockCloseIntentPublicOutput extends Struct({
    
}) {}


export const BlockCloseIntent = ZkProgram({
    name: 'BlockCloseIntent',
    publicInput: BlockCloseIntentPublicInput,
    publicOutput: BlockCloseIntentPublicOutput,
    methods: {
        dummy: {
            privateInputs: [],
            async method(publicInput: BlockCloseIntentPublicInput): Promise<{ publicOutput: BlockCloseIntentPublicOutput }> {
                return { publicOutput: publicInput };
            }
        }
    }
})

export class BlockCloseIntentProof extends ZkProgram.Proof(BlockCloseIntent) {}

const flags = FeatureFlags.allMaybe;
export class BlockCloseIntentDynamicProof extends DynamicProof<BlockCloseIntentPublicInput, BlockCloseIntentPublicOutput> {
  static publicInputType = BlockCloseIntentPublicInput;
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
}) {}
    
export class OracleBlockDataProofPublicOutput extends Struct({
    minaVaultTypeUpdate: VaultTypeUpdate,
    suiVaultTypeUpdate: VaultTypeUpdate,
    timestamp: Timestamp,
}) {}

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


export class BlockCloseIntentPrivateInput extends Struct({
    oracleBlockDataProof: OracleBlockDataProof,
    historicalStateMap: HistoricalBlockStateMap,
}) {}