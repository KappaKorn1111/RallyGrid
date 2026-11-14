import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";
import { Server } from "colyseus";
import { Client, type Room } from "colyseus.js";
import type { GameEvent, MatchState } from "@rallygrid/game-core";
import { RallyGridRoom } from "./rally-grid-room.js";

function nextMessage<T>(room: Room, messageType: string, timeoutMs = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${messageType}`)), timeoutMs);
    room.onMessage(messageType, (message: T) => {
      clearTimeout(timeout);
      resolve(message);
    });
  });
}

describe("live Colyseus RALLYGRID room", () => {
  it("accepts two clients, enforces the serving player, and broadcasts server-generated dice targets", async () => {
    const httpServer = createServer();
    const gameServer = new Server({ server: httpServer });
    gameServer.define("rallygrid", RallyGridRoom);
    await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
    const address = httpServer.address() as AddressInfo;
    const endpoint = `ws://127.0.0.1:${address.port}`;
    const client1 = new Client(endpoint);
    const client2 = new Client(endpoint);
    let room1: Room | undefined;
    let room2: Room | undefined;

    try {
      room1 = await client1.joinOrCreate("rallygrid", { displayName: "Player One" });
      room2 = await client2.joinOrCreate("rallygrid", { displayName: "Player Two" });

      const rejectedRoll = nextMessage<{ reason: string }>(room2, "match:error");
      room2.send("match:roll");
      await expect(rejectedRoll).resolves.toMatchObject({ reason: "Only the current server can roll." });

      const firstClientDice = nextMessage<{ state: MatchState; events: readonly GameEvent[] }>(room1, "match:dice");
      const secondClientDice = nextMessage<{ state: MatchState; events: readonly GameEvent[] }>(room2, "match:dice");
      room1.send("match:roll");
      const [first, second] = await Promise.all([firstClientDice, secondClientDice]);

      expect(first.state.status).toBe("countdown");
      expect(first.state.activeRally?.target).toBeGreaterThanOrEqual(0);
      expect(first.state.activeRally?.target).toBeLessThanOrEqual(8);
      expect(second.state.activeRally?.target).toBe(first.state.activeRally?.target);
      expect(first.events.some((event) => event.type === "dice.rolled")).toBe(true);
    } finally {
      await Promise.all([room1?.leave(), room2?.leave()]);
      await gameServer.gracefullyShutdown(false);
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    }
  }, 15000);
});
