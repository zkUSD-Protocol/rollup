// src/benchmark.ts
import { promises as fs } from 'fs';
import { Field } from 'o1js';
import yaml from 'js-yaml';

import { GovernanceAction1Intent } from './intents/governance/action1.js';
import { GovernanceAction2Intent } from './intents/governance/action2.js';
import { ZkusdRollup } from './rollup.js';
import { OracleBlockDataProgram } from './intents/block-close-intent.js';
import { GovActionIntent } from './intents/governance/wrapper.js';
import { BridgeIntent } from './intents/bridge.js';
import { CreateVaultIntent } from './intents/create-vault.js';
import { DepositIntent} from './intents/deposit.js';
import { MintIntent } from './intents/mint.js';
import { BurnIntent } from './intents/burn.js';
import { RedeemIntent } from './intents/redeem.js';
import { BridgeBackIntent } from './intents/bridge-back.js';
import { ZkusdBridgeState } from './prove/observer/zkusd-bridge-state.js';
import { TransferIntent } from './intents/transfer.js';

const PROGRAMS = [
  { name: 'ObserverPriceProof', program: OracleBlockDataProgram },
  { name: 'ObserverBridgeStateProof', program: ZkusdBridgeState },
  { name: 'GovernanceAction1Intent', program: GovernanceAction1Intent },
  { name: 'GovernanceAction2Intent', program: GovernanceAction2Intent },
  { name: 'GovActionIntent', program: GovActionIntent },
  { name: 'BridgeIntent', program: BridgeIntent },
  { name: 'BridgeBackIntent', program: BridgeBackIntent },
  { name: 'CreateVaultIntent', program: CreateVaultIntent },
  { name: 'TransferIntent', program: TransferIntent },
  { name: 'DepositIntent', program: DepositIntent },
  { name: 'RedeemIntent', program: RedeemIntent },
  { name: 'MintIntent', program: MintIntent },
  { name: 'BurnIntent', program: BurnIntent },
  { name: 'ZkusdRollup', program: ZkusdRollup }
];

const benchmark = async () => {
  const report: any = {
    date: new Date().toISOString(),
    environment: {
      node: process.version,
      platform: process.platform
    },
    programs: {}
  };

  for (const { name, program } of PROGRAMS) {
    console.log(`Benchmarking ${name}...`);

    const compileStart = performance.now();
    // turn off cache to get the accurate compilation times.
    await program.compile();
    const compileEnd = performance.now();

    const analysis = await program.analyzeMethods() as Record<string, any>;

    report.programs[name] = {
      compile_time_ms: +(compileEnd - compileStart).toFixed(2),
      methods: {}
    };

    for (const methodName in analysis) {
      const m = analysis[methodName];
      report.programs[name].methods[methodName] = {
        constraints: m.rows,
      };
    }
  }

  const yamlData = yaml.dump(report);
  await fs.writeFile('benchmark-report.yaml', yamlData);
  console.log('Benchmark report written to benchmark-report.yaml');
};

benchmark().catch((err) => {
  console.error('Benchmarking failed:', err);
})
