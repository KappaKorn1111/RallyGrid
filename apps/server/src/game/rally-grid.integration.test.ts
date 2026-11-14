import { describe, expect, it } from "vitest";
import { createMatch, otherPlayer, type RandomSource } from "@rallygrid/game-core";
import { RallyPhysics } from "./rally-physics.js";

const deterministicRandom: RandomSource = {
  nextInt(min, max) { return Math.floor((min + max) / 2); }
};

describe("RALLYGRID authoritative match integration", () => {
  it("uses server simulation, not client-declared outcomes, to resolve a missed paddle", () => {
    const match = createMatch({ matchId: "authoritative-integration" }, deterministicRandom);
    const physics = new RallyPhysics(deterministicRandom);

    match.rollDice();
    const target = match.state.activeRally?.target;
    expect(target).toBeDefined();
    match.startCountdown();
    match.startRally(1);
    physics.reset(match.state.server);
    physics.setPaddleAxis("player-2", 1);

    let losingPlayer: ReturnType<typeof otherPlayer> | null = null;
    for (let frame = 0; frame < 3000 && losingPlayer === null; frame++) {
      losingPlayer = physics.tick(50);
      const collision = physics.consumeCollision();
      if (collision) match.recordPaddleCollision(collision);
    }

    expect(losingPlayer).toBe("player-2");
    if (losingPlayer === null) throw new Error("Expected server physics to resolve a missed paddle.");
    match.resolveRally(otherPlayer(losingPlayer), 200);
    expect(match.state.board[target!]).toBe("player-1");
    expect(match.state.activeRally?.result).toEqual({
      kind: "win",
      winner: "player-1",
      loser: "player-2",
      cell: target
    });
    expect(match.events.some((event) => event.type === "rally.ended")).toBe(true);
  });
});
