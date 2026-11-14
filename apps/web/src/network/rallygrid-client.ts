import { Client, type Room } from "colyseus.js";
import { validateMatchState, type GameEvent, type MatchState } from "@rallygrid/game-core";

export interface RallyPhysicsSnapshot {
  readonly ball: { readonly x: number; readonly y: number; readonly vx: number; readonly vy: number };
  readonly paddles: { readonly player1Y: number; readonly player2Y: number };
}
export interface RallyGridClientCallbacks {
  readonly onPlayer?: (player: "player-1" | "player-2") => void;
  readonly onState?: (state: MatchState, events?: readonly GameEvent[]) => void;
  readonly onPhysics?: (snapshot: RallyPhysicsSnapshot) => void;
  readonly onError?: (message: string) => void;
  readonly onDisconnected?: () => void;
}
function endpoint(): string {
  if (import.meta.env.VITE_GAME_SERVER_URL) return import.meta.env.VITE_GAME_SERVER_URL;
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.hostname}:2567`;
}
function readState(value: unknown): MatchState | null {
  if (!value || typeof value !== "object" || !("state" in value)) return null;
  try {
    const state = (value as { state: MatchState }).state;
    validateMatchState(state);
    return state;
  } catch {
    return null;
  }
}
function readPhysics(value: unknown): RallyPhysicsSnapshot | null {
  if (!value || typeof value !== "object" || !("ball" in value) || !("paddles" in value)) return null;
  const candidate = value as RallyPhysicsSnapshot;
  const values = [candidate.ball?.x, candidate.ball?.y, candidate.ball?.vx, candidate.ball?.vy,
    candidate.paddles?.player1Y, candidate.paddles?.player2Y];
  return values.every((number) => typeof number === "number" && Number.isFinite(number)) ? candidate : null;
}

/** Browser adapter for the authoritative Colyseus room. No game rules are evaluated client-side. */
export class RallyGridClient {
  private room: Room | null = null;
  constructor(private readonly callbacks: RallyGridClientCallbacks = {}) {}

  async join(displayName: string): Promise<void> {
    if (this.room) throw new Error("This client is already connected to a room.");
    const client = new Client(endpoint());
    const room = await client.joinOrCreate("rallygrid", { displayName: displayName.trim().slice(0, 24) });
    this.room = room;
    room.onMessage("match:welcome", (payload: unknown) => {
      if (payload && typeof payload === "object" && "player" in payload) {
        const player = (payload as { player: unknown }).player;
        if (player === "player-1" || player === "player-2") this.callbacks.onPlayer?.(player);
      }
      const state = readState(payload);
      if (state) this.callbacks.onState?.(state);
    });
    for (const type of ["match:update", "match:dice", "match:rally-started", "match:rally-result", "match:ended"]) {
      room.onMessage(type, (payload: unknown) => {
        const state = readState(payload);
        if (state) this.callbacks.onState?.(state);
      });
    }
    room.onMessage("match:physics", (payload: unknown) => {
      const physics = readPhysics(payload);
      if (physics) this.callbacks.onPhysics?.(physics);
    });
    room.onMessage("match:error", (payload: unknown) => {
      if (payload && typeof payload === "object" && "reason" in payload) {
        this.callbacks.onError?.(String((payload as { reason: unknown }).reason));
      }
    });
    room.onLeave(() => {
      this.room = null;
      this.callbacks.onDisconnected?.();
    });
    room.onError((_code, message) => this.callbacks.onError?.(message || "Multiplayer connection error."));
  }

  rollDice(): void { this.requireRoom().send("match:roll"); }
  setPaddleAxis(axis: -1 | 0 | 1): void { this.requireRoom().send("paddle:input", { axis }); }
  async leave(): Promise<void> {
    const room = this.room;
    this.room = null;
    if (room) await room.leave();
  }
  private requireRoom(): Room {
    if (!this.room) throw new Error("Not connected to a RALLYGRID room.");
    return this.room;
  }
}
