import { ZkProgram, DynamicProof, FeatureFlags } from "o1js";
import { FizkTokenTransferPreconditions, FizkTokenTransferPublicOutput} from "./common.js";
import { FizkTokenTransferPrivateInput, transferFizkToken } from "./transfer.js";

export const FizkTokenIntentWrapper = ZkProgram({
    name: 'FizkTokenIntentWrapper',
    publicInput: FizkTokenTransferPreconditions,
    publicOutput: FizkTokenTransferPublicOutput,
    methods: {
        transfer: {
            privateInputs: [FizkTokenTransferPrivateInput],
            method(publicInput: FizkTokenTransferPreconditions, privateInput: FizkTokenTransferPrivateInput): Promise<{ publicOutput: FizkTokenTransferPublicOutput }> {
                return Promise.resolve(transferFizkToken(publicInput, privateInput));
            }
        }
    }
})

export class FizkTokenIntentWrapperProof extends ZkProgram.Proof(FizkTokenIntentWrapper) {}

const flags = FeatureFlags.allNone;
export class FizkTokenIntentWrapperDynamicProof extends DynamicProof<FizkTokenTransferPreconditions, FizkTokenTransferPublicOutput> {
  static publicInputType = FizkTokenTransferPreconditions;
  static publicOutputType = FizkTokenTransferPublicOutput;
  static maxProofsVerified = 0 as const;
  static featureFlags = flags;
}