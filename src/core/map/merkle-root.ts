/**
 * MerkleRoot.ts
 *
 * This module defines a generic, type-safe wrapper around a Merkle tree root,
 * used to distinguish between different Merkle trees.
 *
 * The `MerkleRoot` class uses phantom type parameters to enforce compile-time
 * separation between otherwise structurally identical roots.
 *
 * Runtime behavior is unaffected — the extra types exist solely to improve type safety.
 */

import { Field, Struct } from "o1js";

/**
 * A unique symbol used as a phantom field key.
 * This ensures that the phantom type parameters `T` is part of the type,
 * but do not appear in the runtime structure.
 *
 * The use of a `unique symbol` guarantees that this property can't collide with anything else.
 */
declare const brand: unique symbol;

export class MerkleRoot<T> extends Struct({
	root: Field,
}) {
	/**
	 * Phantom field used purely to "anchor" the generic type parameters.
	 * This prevents `MerkleRoot<A>` and `MerkleRoot<B>`
	 * from being mistakenly used interchangeably.
	 *
	 * Because the field uses a `unique symbol` as its key and is private,
	 * it has no effect on runtime behavior or output size.
	 */
	private [brand]!: [T];

	assertEquals(other: MerkleRoot<T>) {
		this.root.assertEquals(other.root);
	}
}

export function getRoot<T extends { root: Field }>(map: T): MerkleRoot<T> {
	return new MerkleRoot({ root: map.root });
}
	