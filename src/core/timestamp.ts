import { Bool, Field, Struct, UInt64 } from "o1js";


export class Timestamp extends Struct({
    timestampMs: UInt64,
}) {

    toFields(): Field[] {
        return [this.timestampMs.value];
    }

    static fromMillis(timestampMs: number): Timestamp {
        return new Timestamp({ timestampMs: UInt64.from(timestampMs) });
    }

    static fromSeconds(timestampSeconds: number): Timestamp {
        return new Timestamp({ timestampMs: UInt64.from(timestampSeconds * 1000) });
    }

    assertEquals(other: Timestamp) {
        this.timestampMs.assertEquals(other.timestampMs);
    }

    assertGreaterOrEqual(other: Timestamp) {
        this.timestampMs.assertGreaterThanOrEqual(other.timestampMs);
    }

    isGreaterBy(other: Timestamp, milliseconds: UInt64): Bool {
        return this.timestampMs.greaterThanOrEqual(other.timestampMs.add(milliseconds));
    }

    assertLessOrEqual(other: Timestamp) {
        this.timestampMs.assertLessThanOrEqual(other.timestampMs);
    }
}