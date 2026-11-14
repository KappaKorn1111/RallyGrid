import { randomInt } from "node:crypto";
import type { RandomSource } from "@rallygrid/game-core";

/** Cryptographically secure, unbiased inclusive integer source for authoritative server outcomes. */
export const secureGameRandom: RandomSource = Object.freeze({
  nextInt(minInclusive: number, maxInclusive: number): number {
    if (!Number.isSafeInteger(minInclusive) || !Number.isSafeInteger(maxInclusive) || maxInclusive < minInclusive) {
      throw new RangeError("Invalid random integer range.");
    }
    return randomInt(minInclusive, maxInclusive + 1);
  }
});
