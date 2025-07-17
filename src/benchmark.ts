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
import { ZkusdRollup }               from './rollup.js';
import { OracleBlockDataProgram }    from './intents/block-close-intent.js';
import { GovActionIntent }           from './intents/governance/wrapper.js';
import { BridgeIntent }              from './intents/bridge.js';
import { CreateVaultIntent }         from './intents/create-vault.js';
import { DepositIntent }             from './intents/deposit.js';
import { MintIntent }                from './intents/mint.js';
import { BurnIntent }                from './intents/burn.js';
import { LiquidateIntent }           from './intents/liquidate.js';
import { RedeemIntent }              from './intents/redeem.js';
import { BridgeInIntent }            from './intents/bridge-back.js';
import { ZkusdBridgeState }          from './prove/observer/zkusd-bridge-state.js';
import { TransferIntent }            from './intents/transfer.js';
import { ProveCollateralIO }         from './domain/bridging/prove-collateral-io.js';
import { Cache } from 'o1js';
import console from 'node:console';

// ─────────────────────────────────────────────────────────────────────────────
// List of programs to compile (same identifiers & order as before)
// ─────────────────────────────────────────────────────────────────────────────
const PROGRAMS = [
  { name: 'ObserverPriceProof',          program: OracleBlockDataProgram },
  { name: 'ObserverBridgeStateProof',    program: ZkusdBridgeState },
  { name: 'GovernanceAction1Intent',     program: GovernanceAction1Intent },
  { name: 'GovernanceAction2Intent',     program: GovernanceAction2Intent },
  { name: 'CollateralIOProof',           program: ProveCollateralIO },
  { name: 'GovActionIntent',             program: GovActionIntent },
  { name: 'BridgeIntent',                program: BridgeIntent },
  { name: 'BridgeBackIntent',            program: BridgeInIntent },
  { name: 'CreateVaultIntent',           program: CreateVaultIntent },
  { name: 'TransferIntent',              program: TransferIntent },
  { name: 'DepositIntent',               program: DepositIntent },
  { name: 'RedeemIntent',                program: RedeemIntent },
  { name: 'MintIntent',                  program: MintIntent },
  { name: 'BurnIntent',                  program: BurnIntent },
  { name: 'LiquidateIntent',             program: LiquidateIntent },
  { name: 'ZkusdRollup',                 program: ZkusdRollup },
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
async function compileOne({ name, program }: ProgEntry) {
  console.log(`\n⚙️  Compiling ${name}…`);

  const t0 = performance.now();
  // cache: false ⇒ run a full compile even if previous artefacts exist
  // await program.compile({ cache: Cache.None });

  
  await Promise.all([
    program.compile(),
    // every 10 sec use console.log(process.memoryUsage());
  ])
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
  setInterval(() => console.log(process.memoryUsage()), 5000);
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