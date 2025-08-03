import { Bool, Field, Struct, UInt32, UInt64 } from "o1js";


// 34 unsigned bits seconds timestamp will run out after year 2500
// and is compact
export class Timestamp34 extends Struct({
    timestampSeconds: UInt64,
}) {

    toBits(): Bool[] {
        return this.timestampSeconds.toBits().slice(0, 34);
    }

    static fromBits(bits: Bool[]): Timestamp34 {
        return new Timestamp34({ timestampSeconds: UInt64.fromBits(bits.slice(0, 34)) });
    }
     
    static fromTimestamp(timestamp: Timestamp): Timestamp34 {
        // assuming that Timestamp is not after year 2500
        return new Timestamp34({ timestampSeconds: timestamp.timestampMs.divMod(1000).quotient });
    }

    static toTimestamp(timestamp34: Timestamp34): Timestamp {
        return new Timestamp({ timestampMs: timestamp34.timestampSeconds.mul(UInt64.from(1000)) });
    }

    static fromSeconds(seconds: UInt32): Timestamp34 {
        return new Timestamp34({ timestampSeconds: UInt64.from(seconds) });
    }
    
    static unsafeFromSeconds(seconds: UInt64): Timestamp34 {
        return new Timestamp34({ timestampSeconds: seconds });
    }
    
}

export class Timestamp extends Struct({
    timestampMs: UInt64,
}) {

    toFields(): Field[] {
        return [this.timestampMs.value];
    }

    static fromUInt64(timestampMs: UInt64): Timestamp {
        return new Timestamp({ timestampMs });
    }

    static fromMillis(timestampMs: number): Timestamp {
        return new Timestamp({ timestampMs: UInt64.from(timestampMs) });
    }

    static fromSeconds(timestampSeconds: UInt64): Timestamp {
        // assert less than 2^60 seconds
        timestampSeconds.assertLessThan(UInt64.from(2n**60n));
        return new Timestamp({ timestampMs: timestampSeconds.mul(UInt64.from(1000)) });
    }

    assertEquals(other: Timestamp) {
        this.timestampMs.assertEquals(other.timestampMs);
    }

    assertGreaterOrEqual(other: Timestamp) {
        this.timestampMs.assertGreaterThanOrEqual(other.timestampMs);
    }

    isGreaterThanBy(other: Timestamp, milliseconds: UInt64): Bool {
        return this.timestampMs.greaterThanOrEqual(other.timestampMs.add(milliseconds));
    }

    assertLessOrEqual(other: Timestamp) {
        this.timestampMs.assertLessThanOrEqual(other.timestampMs);
    }
}