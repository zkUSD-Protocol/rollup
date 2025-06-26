

// // the timing function extracted
// function timeAndCompile(program: ZkProgram<any>) {
// 	const startTime = Date.now();
// 	program.compile();
// 	const endTime = Date.now();
// 	console.log(`${program.name} compilation took ${endTime - startTime} ms`);
// }


// async function main() {
// 	// time and compile all the programs
// 	// gov action1 intent program
// 	const startTime = Date.now();
// 	await GovernanceAction1Intent.compile();
// 	const endTime = Date.now();
// 	console.log(`GovernanceAction1Intent compilation took ${endTime - startTime} ms`);
// 	// gov action2 intent program
// 	const startTime2 = Date.now();
// 	await GovernanceAction2Intent.compile();
// 	const endTime2 = Date.now();
// 	console.log(`GovernanceAction2Intent compilation took ${endTime2 - startTime2} ms`);
// 	// gov intent program
// 	const startTime3 = Date.now();
// 	await GovActionIntent.compile();
// 	const endTime3 = Date.now();
// 	console.log(`GovActionIntent compilatoin took ${endTime3 - startTime3} ms`);
// 	// rollup program
// 	const startTime4 = Date.now();
// 	await ZkusdRollup.compile();
// 	const endTime4 = Date.now();
// 	console.log(`ZkusdRollup compilation took ${endTime4 - startTime4} ms`);
// }

// await main()

