import Phaser from "phaser";
import type { RallyPhysicsSnapshot } from "../../network/rallygrid-client.js";

export class GameCanvasScene extends Phaser.Scene {
  private onlineGraphics?: Phaser.GameObjects.Graphics;

  constructor() { super("RallyGridFoundation"); }

  create(): void {
    const { width, height } = this.scale;
    const frame = this.add.graphics();
    frame.lineStyle(2, 0x25435f, 1);
    frame.strokeRoundedRect(width * 0.08, height * 0.12, width * 0.84, height * 0.76, 18);
    frame.lineStyle(1, 0x31536e, 0.8);
    frame.lineBetween(width / 2, height * 0.15, width / 2, height * 0.85);
    for (let y = height * 0.2; y <= height * 0.8; y += height * 0.15) {
      frame.fillStyle(0x39d6e8, 0.8);
      frame.fillCircle(width / 2, y, 2);
    }
    this.add.text(width / 2, height * 0.92, "RALLYGRID · SERVER ARENA", {
      fontFamily: "Arial", fontSize: "12px", color: "#83a9c7", letterSpacing: 3
    }).setOrigin(0.5);
    this.onlineGraphics = this.add.graphics();
    this.game.events.on("online:physics", this.renderOnlinePhysics, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off("online:physics", this.renderOnlinePhysics, this);
    });
  }

  private renderOnlinePhysics(snapshot: RallyPhysicsSnapshot): void {
    if (!this.onlineGraphics) return;
    const { width, height } = this.scale;
    const x = (value: number) => width * (0.08 + ((value + 1) / 2) * 0.84);
    const y = (value: number) => height * (0.12 + ((1 - value) / 2) * 0.76);
    const graphics = this.onlineGraphics;
    graphics.clear();
    graphics.fillStyle(0x39d6e8, 1);
    graphics.fillRoundedRect(x(-0.94) - 5, y(snapshot.paddles.player1Y) - 34, 10, 68, 5);
    graphics.fillStyle(0xff9b54, 1);
    graphics.fillRoundedRect(x(0.94) - 5, y(snapshot.paddles.player2Y) - 34, 10, 68, 5);
    graphics.fillStyle(0xe8f4ff, 1);
    graphics.fillCircle(x(snapshot.ball.x), y(snapshot.ball.y), 8);
  }
}
