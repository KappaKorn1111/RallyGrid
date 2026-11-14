import { randomUUID } from "node:crypto";
import { Room, type Client } from "colyseus";
import { createMatch, otherPlayer, type MatchEngine, type PlayerId } from "@rallygrid/game-core";
import { secureGameRandom } from "../game/secure-random.js";
import { RallyPhysics } from "../game/rally-physics.js";

interface JoinOptions { readonly displayName?: string }
interface PaddleInput { readonly axis?: unknown }
const COUNTDOWN_MS = 3000;
const INPUT_INTERVAL_MS = 1000 / 30;

/** Two-player room. Dice, timers, physics, scoring and match state are server-authoritative. */
export class RallyGridRoom extends Room {
  private game!: MatchEngine;
  private physics = new RallyPhysics(secureGameRandom);
  private readonly playerBySession = new Map<string, PlayerId>();
  private readonly lastInputAt = new Map<string, number>();
  private countdownRemaining = 0;
  private countdownActive = false;

  override onCreate(options: { readonly matchId?: string } = {}): void {
    this.maxClients = 2;
    this.autoDispose = true;
    this.game = createMatch({ matchId: options.matchId?.trim() || randomUUID() }, secureGameRandom);

    this.onMessage("match:roll", (client) => this.handleRoll(client));
    this.onMessage("paddle:input", (client, payload: PaddleInput) => this.handlePaddleInput(client, payload));
    this.setSimulationInterval((deltaTime) => this.update(deltaTime), 1000 / 60);
    this.broadcastMatch("match:created");
  }

  override onJoin(client: Client, options: JoinOptions = {}): void {
    const occupied = new Set(this.playerBySession.values());
    const assigned: PlayerId = !occupied.has("player-1") ? "player-1" : "player-2";
    this.playerBySession.set(client.sessionId, assigned);
    const displayName = typeof options.displayName === "string" ? options.displayName.trim().slice(0, 24) : "";
    client.send("match:welcome", { player: assigned, displayName: displayName || assigned, state: this.game.state });
    this.broadcast("match:player-joined", { player: assigned, playersConnected: this.playerBySession.size });
    this.broadcastMatch("match:update");
  }

  override onLeave(client: Client): void {
    const player = this.playerBySession.get(client.sessionId);
    if (player) {
      this.playerBySession.delete(client.sessionId);
      this.lastInputAt.delete(client.sessionId);
      this.broadcast("match:player-left", { player, playersConnected: this.playerBySession.size });
    }
  }

  private handleRoll(client: Client): void {
    const player = this.playerBySession.get(client.sessionId);
    if (!player || this.playerBySession.size !== 2) return this.reject(client, "Two players must be connected.");
    if (player !== this.game.state.server) return this.reject(client, "Only the current server can roll.");
    if (this.countdownActive) return this.reject(client, "A rally countdown is already active.");
    try {
      this.game.rollDice();
      this.game.startCountdown();
      this.countdownRemaining = COUNTDOWN_MS;
      this.countdownActive = true;
      this.broadcastMatch("match:dice");
    } catch (error) {
      this.reject(client, error instanceof Error ? error.message : "Unable to start rally.");
    }
  }

  private handlePaddleInput(client: Client, payload: PaddleInput): void {
    const player = this.playerBySession.get(client.sessionId);
    if (!player || this.game.state.status !== "rally" || !payload || typeof payload !== "object") return;
    const now = Date.now();
    const previous = this.lastInputAt.get(client.sessionId) ?? 0;
    if (now - previous < INPUT_INTERVAL_MS) return;
    if (typeof payload.axis !== "number" || !Number.isFinite(payload.axis)) return this.reject(client, "Paddle axis must be a finite number.");
    this.lastInputAt.set(client.sessionId, now);
    this.physics.setPaddleAxis(player, payload.axis);
  }

  private update(deltaTime: number): void {
    if (this.playerBySession.size !== 2) return;
    if (this.countdownActive) {
      this.countdownRemaining -= Math.min(deltaTime, 100);
      if (this.countdownRemaining <= 0) {
        this.countdownActive = false;
        this.game.startRally(Date.now());
        this.physics.reset(this.game.state.server);
        this.broadcastMatch("match:rally-started");
      }
      return;
    }
    if (this.game.state.status !== "rally") return;
    const losingPlayer = this.physics.tick(deltaTime);
    const collisionPlayer = this.physics.consumeCollision();
    if (collisionPlayer) this.game.recordPaddleCollision(collisionPlayer);
    if (losingPlayer) {
      this.game.resolveRally(otherPlayer(losingPlayer), Date.now());
      this.broadcast("match:rally-result", {
        losingPlayer,
        winningPlayer: otherPlayer(losingPlayer),
        physics: this.physics.snapshot(),
        state: this.game.state,
        events: this.game.events
      });
      if (this.game.state.status === "completed") {
        this.broadcast("match:ended", { outcome: this.game.state.outcome, state: this.game.state });
      } else {
        this.physics.reset(this.game.state.server);
        this.broadcastMatch("match:update");
      }
      return;
    }
    this.broadcast("match:physics", this.physics.snapshot());
  }

  private broadcastMatch(type: string): void {
    this.broadcast(type, { state: this.game.state, events: this.game.events });
  }

  private reject(client: Client, reason: string): void {
    client.send("match:error", { reason });
  }
}
