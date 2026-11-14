import type { PlayerId, RandomSource } from "@rallygrid/game-core";

export interface RallyPhysicsSnapshot {
  readonly ball: { readonly x: number; readonly y: number; readonly vx: number; readonly vy: number };
  readonly paddles: { readonly player1Y: number; readonly player2Y: number };
}
const PADDLE_LIMIT = 0.78;
const PADDLE_HALF_HEIGHT = 0.18;
const BALL_RADIUS = 0.025;
const WALL_LIMIT = 1 - BALL_RADIUS;
const PADDLE_X = 0.94;
const PADDLE_SPEED = 1.7;
const BALL_SPEED = 0.9;

/** Deterministic, server-ticked Pong rally simulation. Coordinates are normalized to [-1, 1]. */
export class RallyPhysics {
  private ball = { x: 0, y: 0, vx: 0, vy: 0 };
  private paddles = { player1Y: 0, player2Y: 0 };
  private axes: Record<PlayerId, number> = { "player-1": 0, "player-2": 0 };
  private collision: PlayerId | null = null;
  constructor(private readonly random: RandomSource) {}

  reset(server: PlayerId): void {
    if (server !== "player-1" && server !== "player-2") throw new TypeError("Invalid rally server.");
    const vertical = (this.random.nextInt(0, 1000) / 1000 - 0.5) * 0.7;
    this.ball = { x: 0, y: 0, vx: server === "player-1" ? BALL_SPEED : -BALL_SPEED, vy: vertical };
    this.paddles = { player1Y: 0, player2Y: 0 };
    this.axes = { "player-1": 0, "player-2": 0 };
    this.collision = null;
  }

  setPaddleAxis(player: PlayerId, axis: number): void {
    if (player !== "player-1" && player !== "player-2") throw new TypeError("Invalid paddle owner.");
    if (!Number.isFinite(axis)) throw new TypeError("Paddle axis must be finite.");
    this.axes[player] = Math.max(-1, Math.min(1, axis));
  }

  tick(deltaMs: number): PlayerId | null {
    if (!Number.isFinite(deltaMs) || deltaMs < 0) throw new RangeError("Invalid simulation delta.");
    const dt = Math.min(deltaMs, 50) / 1000;
    this.paddles.player1Y = clamp(this.paddles.player1Y + this.axes["player-1"] * PADDLE_SPEED * dt, -PADDLE_LIMIT, PADDLE_LIMIT);
    this.paddles.player2Y = clamp(this.paddles.player2Y + this.axes["player-2"] * PADDLE_SPEED * dt, -PADDLE_LIMIT, PADDLE_LIMIT);
    const previousX = this.ball.x;
    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;
    if (this.ball.y > WALL_LIMIT) { this.ball.y = WALL_LIMIT; this.ball.vy = -Math.abs(this.ball.vy); }
    if (this.ball.y < -WALL_LIMIT) { this.ball.y = -WALL_LIMIT; this.ball.vy = Math.abs(this.ball.vy); }

    if (this.ball.vx < 0 && previousX > -PADDLE_X && this.ball.x <= -PADDLE_X) {
      if (Math.abs(this.ball.y - this.paddles.player1Y) > PADDLE_HALF_HEIGHT + BALL_RADIUS) return "player-1";
      this.bounce("player-1");
    } else if (this.ball.vx > 0 && previousX < PADDLE_X && this.ball.x >= PADDLE_X) {
      if (Math.abs(this.ball.y - this.paddles.player2Y) > PADDLE_HALF_HEIGHT + BALL_RADIUS) return "player-2";
      this.bounce("player-2");
    }
    return null;
  }

  consumeCollision(): PlayerId | null {
    const collision = this.collision;
    this.collision = null;
    return collision;
  }

  snapshot(): RallyPhysicsSnapshot {
    return { ball: { ...this.ball }, paddles: { ...this.paddles } };
  }

  private bounce(player: PlayerId): void {
    this.collision = player;
    const paddleY = player === "player-1" ? this.paddles.player1Y : this.paddles.player2Y;
    const offset = clamp((this.ball.y - paddleY) / (PADDLE_HALF_HEIGHT + BALL_RADIUS), -1, 1);
    const direction = player === "player-1" ? 1 : -1;
    this.ball.vx = direction * BALL_SPEED;
    this.ball.vy = offset * BALL_SPEED * 0.9;
    this.ball.x = player === "player-1" ? -PADDLE_X + BALL_RADIUS : PADDLE_X - BALL_RADIUS;
  }
}
function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, value)); }
