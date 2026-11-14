import { describe, expect, it } from "vitest";
import { RallyPhysics } from "./rally-physics.js";
import type { RandomSource } from "@rallygrid/game-core";
const zeroRandom: RandomSource = { nextInt: () => 500 };
describe("authoritative rally physics", () => {
  it("serves toward the receiver based on the selected server", () => {
    const physics = new RallyPhysics(zeroRandom);
    physics.reset("player-1");
    expect(physics.snapshot().ball.vx).toBeGreaterThan(0);
    physics.reset("player-2");
    expect(physics.snapshot().ball.vx).toBeLessThan(0);
  });
  it("rejects invalid paddle inputs and simulation deltas", () => {
    const physics = new RallyPhysics(zeroRandom);
    expect(() => physics.setPaddleAxis("player-1", Number.NaN)).toThrow();
    expect(() => physics.tick(-1)).toThrow();
  });
  it("moves paddles within server-enforced bounds", () => {
    const physics = new RallyPhysics(zeroRandom);
    physics.reset("player-1");
    physics.setPaddleAxis("player-1", 1);
    for (let i = 0; i < 100; i++) physics.tick(50);
    expect(physics.snapshot().paddles.player1Y).toBeLessThanOrEqual(0.78);
  });
  it("detects a missed paddle as the losing player", () => {
    const physics = new RallyPhysics(zeroRandom);
    physics.reset("player-1");
    let loser: string | null = null;
    for (let i = 0; i < 3000 && loser === null; i++) loser = physics.tick(50);
    expect(loser).toBe("player-2");
  });
});
