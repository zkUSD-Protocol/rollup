// src/benchmark.ts — sequential compile‑only benchmark (o1js ≥ 2.7)
// -----------------------------------------------------------------------------
// Run with plenty of heap **and** explicit GC so witness buffers are reclaimed:
//   NODE_OPTIONS="--max-old-space-size=8192 --expose-gc" bunx ts-node src/benchmark.ts
// -----------------------------------------------------------------------------

import { promises as fs } from 'fs';
import { performance } from 'node:perf_hooks';
import yaml from 'js-yaml';

// ─────────────────────────────────────────────────────────────────────────────
// Program imports – keep exactly the same paths you already use
// ─────────────────────────────────────────────────────────────────────────────
import { GovernanceAction1Intent }   from './intents/governance/action1.js';
import { GovernanceAction2Intent }   from './intents/governance/action2.js';
// import { ZkusdRollup }               from './rollup2.js';
import { CreateVaultComputation }    from './computation/create-vault.js';
import { BlockCloseComputation }     from './computation/close-block.js';
import { DepositCollateralComputation }     from './computation/deposit-collateral.js';
import { RedeemCollateralComputation }     from './computation/redeem-collateral.js';
import { BridgeOutComputation }     from './computation/bridge-out.js';
import { BridgeInComputation }     from './computation/bridge-in.js';
import { BurnComputation }     from './computation/burn.js';
import { MintComputation }     from './computation/mint.js';
import { LiquidateComputation }     from './computation/liquidate.js';
import { TransferComputation }     from './computation/transfer.js';
import { GovCreateProposalComputation }     from './computation/gov-create-proposal.js';
import { GovVetoProposalComputation }     from './computation/gov-veto-proposal.js';
import { GovExecuteUpdateComputation }     from './computation/gov-execute-update.js';
import { OracleBlockDataProgram }    from './intents/block-close-intent.js';
import { GovActionIntent }           from './intents/governance/wrapper.js';
import { BridgeIntent }              from './intents/bridge-out.js';
import { CreateVaultIntent }         from './intents/create-vault.js';
import { DepositIntent }             from './intents/deposit.js';
import { MintIntent }                from './intents/mint.js';
import { BurnIntent }                from './intents/burn.js';
import { LiquidateIntent }           from './intents/liquidate.js';
import { RedeemIntent }              from './intents/redeem.js';
import { BridgeInIntent }            from './intents/bridge-in.js';
import { ZkusdBridgeState }          from './prove/observer/zkusd-bridge-state.js';
import { TransferIntent }            from './intents/transfer.js';
import { ProveCollateralIO }         from './domain/bridging/prove-collateral-io.js';
import { Cache } from 'o1js';
import console from 'node:console';
import { FizkRollup } from './rollup3.js';
import { FizkStateUpdateRollup } from './rollup/state-update-rollup.js';

// ─────────────────────────────────────────────────────────────────────────────
// List of programs to compile (same identifiers & order as before)
// ─────────────────────────────────────────────────────────────────────────────
const PROGRAMS = [
  // { name: 'BurnIntent',                  program: BurnIntent, lazy: true },
  // { name: 'BurnComputation',       program: BurnComputation, lazy: true },
  { name: 'ObserverPriceProof',          program: OracleBlockDataProgram, lazy: true },
  // { name: 'ObserverBridgeStateProof',    program: ZkusdBridgeState, lazy: true },
  // { name: 'GovernanceAction1Intent',     program: GovernanceAction1Intent, lazy: true },
  // { name: 'GovernanceAction2Intent',     program: GovernanceAction2Intent, lazy: true },
  // { name: 'CollateralIOProof',           program: ProveCollateralIO, lazy: true },
  // { name: 'GovActionIntent',             program: GovActionIntent, lazy: true },
  // { name: 'BridgeIntent',                program: BridgeIntent, lazy: true },
  // { name: 'BridgeBackIntent',            program: BridgeInIntent, lazy: true },
  // { name: 'CreateVaultIntent',           program: CreateVaultIntent, lazy: true },
  // { name: 'TransferIntent',              program: TransferIntent, lazy: true },
  // { name: 'DepositIntent',               program: DepositIntent, lazy: true },
  // { name: 'RedeemIntent',                program: RedeemIntent, lazy: true },
  // { name: 'MintIntent',                  program: MintIntent, lazy: true },
  // { name: 'LiquidateIntent',             program: LiquidateIntent, lazy: true },
  // { name: 'CreateVaultComputation',      program: CreateVaultComputation, lazy: true },
  // { name: 'BlockCloseComputation',       program: BlockCloseComputation, lazy: true },
  // { name: 'DepositCollateralComputation',       program: DepositCollateralComputation, lazy: true },
  // { name: 'RedeemCollateralComputation',       program: RedeemCollateralComputation, lazy: true },
  // { name: 'BridgeOutComputation',       program: BridgeOutComputation, lazy: true },
  // { name: 'BridgeInComputation',       program: BridgeInComputation, lazy: true },
  // { name: 'MintComputation',       program: MintComputation, lazy: true },
  // { name: 'LiquidateComputation',       program: LiquidateComputation, lazy: true },
  // { name: 'TransferComputation',       program: TransferComputation, lazy: true },
  // { name: 'GovCreateProposalComputation',       program: GovCreateProposalComputation, lazy: true },
  // { name: 'GovVetoProposalComputation',       program: GovVetoProposalComputation, lazy: true },
  // { name: 'GovExecuteUpdateComputation',       program: GovExecuteUpdateComputation, lazy: true },
  // { name: 'FizkRollup',                 program: FizkRollup, lazy: false },
  { name: 'ZkusdRollup',                 program: FizkStateUpdateRollup, lazy: false },
] as const;

type ProgEntry = (typeof PROGRAMS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: extract zk‑method names from a compiled ZkProgram
// We ignore utility props (compile, verify, …) and only keep real circuit methods.
// ─────────────────────────────────────────────────────────────────────────────
function getMethodNames(program: any): string[] {
  const reserved = new Set([
    'name',
    'compile',
    'verify',
    'digest',
    'Proof',
    'analyzeMethods',
    'analyzeSingleMethod',
    'setProofsEnabled',
    'maxProofsVerified',
    'publicInputType',
    'publicOutputType',
    'proofsEnabled',
  ]);
  // print all the methods apart from the reserved ones
  console.log(Object.keys(program).filter(
    (k) => typeof (program as any)[k] === 'function' && !reserved.has(k),
  ));
  return Object.keys(program).filter(
    (k) => typeof (program as any)[k] === 'function' && !reserved.has(k),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Compile + analyze one program, returning its stats (uses analyzeSingleMethod)
// ─────────────────────────────────────────────────────────────────────────────
async function compileOne({ name, program, lazy }: ProgEntry) {
  console.log(`\n⚙️  Compiling ${name}…`);

  const t0 = performance.now();
  // cache: false ⇒ run a full compile even if previous artefacts exist
  // await program.compile({ cache: Cache.None });

  await program.compile();

  
  // await Promise.all([
  //   program.compile({proofsEnabled: lazy}),
  //   // every 10 sec use console.log(process.memoryUsage());
  // ])
  const compileMs = performance.now() - t0;

  let methods: Record<string, { constraints: any }> = {};


  const rawMethods = await program.analyzeMethods() as { [k: string]: any };

  methods = Object.fromEntries(
    Object.entries(rawMethods).map(([key, value]) => [key, value.summary()])
  );
  global.gc?.();
  // ‑‑ new in o1js 2.7: analyze each method separately
  // for (const methodName of getMethodNames(program)) {
  //   console.log(`\n⚙️  Analyzing ${name}.${methodName}…`);
  //   let summary = {};
  //   try {
  //     summary = (await (program as any).analyzeSingleMethod(methodName) as any).summary();
  //   } catch (err) {
  //     console.error(`  ${methodName}: ${err}`);
  //   }
  //   methods[methodName] = { constraints: summary };
  //   // free witness buffers early – helps in CI
  //   global.gc?.();
  // }

  return {
    compile_time_ms: +compileMs.toFixed(2),
    methods,
  } as const;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main driver
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const report: Record<string, any> = {
    date: new Date().toISOString(),
    environment: {
      node: process.version,
      platform: process.platform,
    },
    programs: {} as Record<string, any>,
  };

  for (const entry of PROGRAMS) {
    try {
      report.programs[entry.name] = await compileOne(entry);
    } catch (err) {
      console.error(`❌  ${entry.name} failed:`, err);
      report.programs[entry.name] = { error: String(err) };
    }
  }

  const yamlData = yaml.dump(report);
  await fs.writeFile('benchmark-report.yaml', yamlData);
  console.log('\n✅  Benchmark report written to benchmark-report.yaml');
}

main().catch((err) => {
  console.error('Benchmarking failed:', err);
 process.exit(1);
});