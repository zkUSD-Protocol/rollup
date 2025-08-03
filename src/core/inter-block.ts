import { FlexibleProvable, Struct, UInt64 } from "o1js";

export function InterBlock<T extends FlexibleProvable<any>>(valueType: T) {
  return class InterBlock extends Struct({
    previous: valueType,
    current: valueType,
  }) {
    previous!: T;
    current!: T;
  };
}

export class InterBlockUInt64 extends InterBlock(UInt64) {}