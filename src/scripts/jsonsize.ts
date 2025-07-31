import { Field } from "o1js";
import { GovernanceAction1Intent } from "../intents/governance/action1.js";

// Simple function to measure JSON size
function measureJsonSize(obj: any): number {
  const json = JSON.stringify(obj);
  return new TextEncoder().encode(json).length;
}

const PROGRAMS = [
  { name: 'GovernanceAction1Intent', program: GovernanceAction1Intent },
];

const compilePrograms = async () => {
  for (const { name, program } of PROGRAMS) {
    console.log(`Compiling ${name}...`);
    await program.compile();
  }
};

const makeIntentProof1 = async () => {
    const proof = await GovernanceAction1Intent.dummy({ value: Field(0) });
    return proof;
}


async function main() {
  try {
    await compilePrograms();
    const proof = await makeIntentProof1();
    
    // Calculate and print size in bytes
    const sizeInBytes = measureJsonSize(proof);
    console.log(`JSON size: ${sizeInBytes} bytes`);
    console.log(`JSON size: ${(sizeInBytes / 1024).toFixed(2)} KB`);
    
    // Print a sample of the JSON (first 200 chars)
    const jsonSample = JSON.stringify(proof, null, 2).substring(0, 200) + '...';
    console.log('\nSample of the JSON structure:');
    console.log(jsonSample);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();