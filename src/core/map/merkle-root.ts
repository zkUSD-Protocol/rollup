/**
 * MerkleRoot.ts
 *
 * This module defines a generic, type-safe wrapper around a Merkle tree root,
 * used to distinguish between different Merkle tree contexts (e.g., live data vs. intent/staged data).
 *
 * The `MerkleRoot` class uses phantom type parameters to enforce compile-time
 * separation between otherwise structurally identical roots.
 *
 * Runtime behavior is unaffected — the extra types exist solely to improve type safety.
 */

import { Field, Struct } from "o1js";

/**
 * A unique symbol used as a phantom field key.
 * This ensures that the phantom type parameters `T` and `Ty` are part of the type,
 * but do not appear in the runtime structure.
 *
 * The use of a `unique symbol` guarantees that this property can't collide with anything else.
 */
declare const brand: unique symbol;

/**
 * MerkleRoot<T, Ty>
 *
 * A type-safe wrapper around a Merkle root `Field`, parameterized by:
 *
 * - `T`: the type of data stored in the corresponding Merkle tree.
 * - `Ty`: a string literal `'live'` or `'intent'`, distinguishing the use context of the tree.
 *
 * The class extends `Struct` from o1js and contains a single runtime field: `root`.
 * The phantom field `[brand]` is private and only exists to ensure `T` and `Ty` are preserved
 * at the type level for compile-time safety — they are erased during compilation.
 *
 * @template T - The logical data type associated with the Merkle tree.
 * @template Ty - A usage tag for the root, usually 'live' or 'intent'.
 */
export class MerkleRoot<T, Ty extends 'live' | 'intent'> extends Struct({
	root: Field,
}) {
	/**
	 * Phantom field used purely to "anchor" the generic type parameters.
	 * This prevents `MerkleRoot<A, 'live'>` and `MerkleRoot<A, 'intent'>`
	 * from being mistakenly used interchangeably.
	 *
	 * Because the field uses a `unique symbol` as its key and is private,
	 * it has no effect on runtime behavior or output size.
	 */
	private [brand]!: [T, Ty];

	assertEquals(other: MerkleRoot<T, Ty>) {
		this.root.assertEquals(other.root);
	}
}

/**
 * Factory function to create a generic `RollupRoots<T>` class.
 *
 * This class holds both an `intentRoot` and a `liveRoot`, each strongly typed
 * with phantom types to distinguish their usage context.
 *
 * `T` represents the type of data stored in the corresponding Merkle trees.
 *
 * The class is returned dynamically to allow proper generic binding of `T`
 * in the `Struct` definition — avoiding TypeScript’s limitations with generics
 * in class factory functions.
 */
export function RollupRoots<T, T2=T>() {
	return class RollupRoots<T> extends Struct({
		intentRoot: MerkleRoot<T2, 'intent'>,
		liveRoot: MerkleRoot<T2, 'live'>,
	}) {
		readonly [brand]!: [T, T2];
	}
}

// /**
//  * RollupRoots<T>
//  *
//  * A utility type that resolves to the instance type of the `RollupRoots<T>` class
//  * returned by `makeRollupRoots<T>()`.
//  *
//  * This allows you to refer to the concrete class without needing to hold onto
//  * the dynamically generated class itself.
//  */
// export class RollupRoots<T> extends makeRollupRoots<T>() {}