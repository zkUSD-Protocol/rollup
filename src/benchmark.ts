// src/benchmark.ts — sequential compile‑only benchmark that won’t hog the heap
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
import { RedeemIntent }              from './intents/redeem.js';
import { BridgeBackIntent }          from './intents/bridge-back.js';
import { ZkusdBridgeState }          from './prove/observer/zkusd-bridge-state.js';
import { TransferIntent }            from './intents/transfer.js';
import { ProveCollateralIO }         from './domain/bridging/prove-collateral-io.js';

// ─────────────────────────────────────────────────────────────────────────────
// List of programs to compile (exact same identifiers & order as before)
// ─────────────────────────────────────────────────────────────────────────────
const PROGRAMS = [
  { name: 'ObserverPriceProof',          program: OracleBlockDataProgram },
  { name: 'ObserverBridgeStateProof',    program: ZkusdBridgeState },
  { name: 'GovernanceAction1Intent',     program: GovernanceAction1Intent },
  { name: 'GovernanceAction2Intent',     program: GovernanceAction2Intent },
  { name: 'CollateralIOProof',           program: ProveCollateralIO },
  { name: 'GovActionIntent',             program: GovActionIntent },
  { name: 'BridgeIntent',                program: BridgeIntent },
  { name: 'BridgeBackIntent',            program: BridgeBackIntent },
  { name: 'CreateVaultIntent',           program: CreateVaultIntent },
  { name: 'TransferIntent',              program: TransferIntent },
  { name: 'DepositIntent',               program: DepositIntent },
  { name: 'RedeemIntent',                program: RedeemIntent },
  { name: 'MintIntent',                  program: MintIntent },
  { name: 'BurnIntent',                  program: BurnIntent },
  { name: 'ZkusdRollup',                 program: ZkusdRollup },
] as const;

type ProgEntry = (typeof PROGRAMS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Compile + analyze one program, returning its stats
// ─────────────────────────────────────────────────────────────────────────────
async function compileOne({ name, program }: ProgEntry) {
  console.log(`\n⚙️  Compiling ${name}…`);

  const t0 = performance.now();
  // cache: false ⇒ run a full compile even if previous artefacts exist
  // await program.compile({ cache: false });
  const compileMs = performance.now() - t0;

  const analysis = (await program.analyzeMethods()) as Record<string, { rows: number }>;

  // free as much as we can before next compile
  global.gc?.();

  return {
    compile_time_ms: +compileMs.toFixed(2),
    methods: Object.fromEntries(
      Object.entries(analysis).map(([m, { rows }]) => [m, { constraints: rows }]),
    ),
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