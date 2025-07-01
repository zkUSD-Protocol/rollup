/*  compute-rate.ts  ----------------------------------------------------
    Discrete compounding with 18-decimal fixed-point, all-integer ZKP.
*/

import {
  Field,
  provable,
  Provable,
  Struct,
  UInt64,
  ZkProgram,
} from 'o1js';
import { createProvableBigInt } from 'o1js/dist/node/lib/provable/bigint';
import { BigInt348, uint64ToBigInt } from '../../core/BigInt384.js';

/* ------------------------------------------------------------------ */
/*  Constants
/* ------------------------------------------------------------------ */
export const SCALE_BIGINT = 1_000_000_000_000_000_000n;   // 1e18
export const T_SECONDS    = 31_536_000n;                  // seconds per year

export const S = BigInt348.fromBigInt(SCALE_BIGINT);      // 1e18 in-field
export const T = BigInt348.fromBigInt(T_SECONDS);         // 31 536 000 in-field

// safe, public-API way:
class QRPair extends Struct({ q: BigInt348, r: BigInt348 }) {}

/* ------------------------------------------------------------------ */
/*  I/O structs                                                         */
/* ------------------------------------------------------------------ */
export class ComputeRateInput extends Struct({
  lastUpdateTimestampSec: UInt64,
  timestampBlockSec:      UInt64,
  aprValueScaled:         BigInt348,     // APR · 1e18
  rateOldScaled:          BigInt348,  // rate · 1e18
}) {}

export class ComputeRateOutput extends Struct({
  rateNewScaled: BigInt348,
}) {}

/*
* ComputeRate
*/
export function computeRate(
	inp: ComputeRateInput
): ComputeRateOutput {

        /* ---------------------------------------------------------- */
        /* 1.  Δt  (UInt64 → BigInt384)                               */
        /* ---------------------------------------------------------- */
        const dtUInt = inp.timestampBlockSec.sub(inp.lastUpdateTimestampSec);
        dtUInt.assertGreaterThan(UInt64.from(0));

        const dt = uint64ToBigInt(dtUInt);

        /* ---------------------------------------------------------- */
        /* 2.  Integer division: q = ⌊ APRscaled / T ⌋                */
        /* ---------------------------------------------------------- */

        const  x = Field.from(0);

const { q, r } = Provable.witness(QRPair, () =>  {
            const aprJs = inp.aprValueScaled.toBigInt();
            const qJs   = aprJs / T_SECONDS;
            const rJs   = aprJs % T_SECONDS;
            return new QRPair({ q: BigInt348.fromBigInt(qJs),
               r: BigInt348.fromBigInt(rJs) })
  }
);

        // Enforce  APR = q·T + r   and   r < T
        q.mul(T).add(r).assertEquals(inp.aprValueScaled);
        r.lessThan(T).assertTrue();

        /* ---------------------------------------------------------- */
        /* 3. base = S + q   (represents 1 + APR/T)                   */
        /* ---------------------------------------------------------- */
        const base = S.add(q);

        /* ---------------------------------------------------------- */
        /* 4. factorNumerator = base^dt                               */
        /* ---------------------------------------------------------- */
        const factorNumerator = base.pow(dt);        // (S+q)^dt

        /* ---------------------------------------------------------- */
        /* 5. denom = S^(dt-1)                                        */
        /* ---------------------------------------------------------- */
        const dtMinus1 = dt.sub(BigInt348.one());
        const denom    = S.pow(dtMinus1);

        const factorScaled = factorNumerator.div(denom); // = S·(1+APR/T)^dt

        /* ---------------------------------------------------------- */
        /* 6. rateNew = rateOld * factorScaled / S                    */
        /* ---------------------------------------------------------- */
        const rateNewScaled = inp.rateOldScaled
                                .mul(factorScaled)
                                .div(S);             // keep 1e18 scale

        return new ComputeRateOutput({ rateNewScaled });
}

/* ------------------------------------------------------------------ */
/*  ZK program                                                          */
/* ------------------------------------------------------------------ */
export const ComputeRateProgram = ZkProgram({
  name:        'ComputeRate',
  publicInput:  ComputeRateInput,
  publicOutput: ComputeRateOutput,

  methods: {
    compute: {
      privateInputs: [],

      async method(
        inp: ComputeRateInput
      ): Promise<{ publicOutput: ComputeRateOutput }> {
        return {publicOutput: computeRate(inp) };
      },
    },
  },
});