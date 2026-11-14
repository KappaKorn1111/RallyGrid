import type { Board, DiceRoll, RandomSource } from "./types.js";
import { assertBoard, getAvailableCells } from "./board.js";
export function dieToIndex(value: number): number {
 if (!Number.isInteger(value) || value < 1 || value > 6) throw new RangeError("Die result must be an integer from 1 through 6.");
 return value <= 2 ? 0 : value <= 4 ? 1 : 2;
}
export function targetFromDice(die1: number, die2: number): number { return dieToIndex(die1) * 3 + dieToIndex(die2); }
export function validateDiceRoll(roll: {die1:number;die2:number}): void { dieToIndex(roll.die1); dieToIndex(roll.die2); }
export function rollForAvailableTarget(board: Board, random: RandomSource): DiceRoll {
 assertBoard(board);
 const available = getAvailableCells(board);
 if (available.length === 0) throw new Error("Cannot roll: board has no available targets.");
 if (typeof random?.nextInt !== "function") throw new TypeError("A valid random source is required.");
 if (available.length === 1) {
  const target = available[0]!;
  return { die1: target < 3 ? 1 : target < 6 ? 3 : 5, die2: target % 3 === 0 ? 1 : target % 3 === 1 ? 3 : 5, row: Math.floor(target/3), column: target%3, target, rerolls: 0 };
 }
 const maxAttempts = 256;
 for (let rerolls=0; rerolls<maxAttempts; rerolls++) {
  const die1 = random.nextInt(1,6), die2 = random.nextInt(1,6);
  validateDiceRoll({die1,die2});
  const target = targetFromDice(die1,die2);
  if (board[target] === null) return {die1,die2,row:dieToIndex(die1),column:dieToIndex(die2),target,rerolls};
 }
 // A pathological or malicious RNG must not stall the authoritative match.
 const target = available[random.nextInt(0,available.length-1)]!;
 return {die1: target < 3 ? 1 : target < 6 ? 3 : 5, die2: target%3===0?1:target%3===1?3:5,row:Math.floor(target/3),column:target%3,target,rerolls:maxAttempts};
}
