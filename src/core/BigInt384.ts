import { Field, Provable, UInt64 } from "o1js";
import { Experimental } from "o1js";

const LIMB_SIZE   = 116n;
const LIMB_COUNT  = 3n;                 // you want 3×116 = 348 bits
const MAX         = (1n << (LIMB_COUNT * LIMB_SIZE)) - 1n;
const MODULUS     = MAX-116n;          // any proven prime < MAX
// const MODULUS2 = 573374653997517877902705223825521735199141247292070280934397209846730719022121202017504638277531421638539n;

export const BigInt348 = Experimental.createProvableBigInt(MODULUS);

/* ------------------------------------------------------------------ */
/*  Helper: UInt64 → BigInt384                                          */
/* ------------------------------------------------------------------ */
export function uint64ToBigInt(u: UInt64): InstanceType<typeof BigInt348> {
  const big = Provable.witness(BigInt348, () =>
    BigInt348.fromBigInt(u.value.toBigInt())       // off-circuit
  );

  const limbs = big.toFields();
  limbs[0].assertEquals(u.value);                  // same low limb
  for (let i = 1; i < BigInt348.config.limbNum; i++)
    limbs[i].assertEquals(Field.from(0));          // upper limbs zero

  return big;
}
