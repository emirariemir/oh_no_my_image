import { state } from "./state.js";
import { randomRange } from "./utils.js";

export class Enemy {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.speed = 0;
    this.radius = 0;
    this.heading = 0;
    this.respawn();
  }

  respawn() {
    this.radius = randomRange(12, 20);
    this.speed = randomRange(1.1, 2.3);
    const margin = this.radius * 2.8;
    const edge = Math.floor(randomRange(0, 4));
    let baseHeading = 0;

    if (edge === 0) {
      this.x = randomRange(0, state.width);
      this.y = -margin;
      baseHeading = Math.PI * 0.5;
    } else if (edge === 1) {
      this.x = state.width + margin;
      this.y = randomRange(0, state.height);
      baseHeading = Math.PI;
    } else if (edge === 2) {
      this.x = randomRange(0, state.width);
      this.y = state.height + margin;
      baseHeading = Math.PI * 1.5;
    } else {
      this.x = -margin;
      this.y = randomRange(0, state.height);
      baseHeading = 0;
    }

    this.heading = baseHeading + randomRange(-0.65, 0.65);
    this.vx = Math.cos(this.heading) * this.speed;
    this.vy = Math.sin(this.heading) * this.speed;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const margin = this.radius * 3;
    const outOfBounds =
      this.x < -margin ||
      this.x > state.width + margin ||
      this.y < -margin ||
      this.y > state.height + margin;

    if (outOfBounds) {
      this.respawn();
    }
  }

  touches(particle) {
    const dx = particle.x + particle.size * 0.5 - this.x;
    const dy = particle.y + particle.size * 0.5 - this.y;
    const reach = this.radius + particle.size * 0.5;
    return dx * dx + dy * dy <= reach * reach;
  }

  draw(ctx) {
    const tailX = Math.cos(this.heading) * this.radius * 1.6;
    const tailY = Math.sin(this.heading) * this.radius * 1.6;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 1.45, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 108, 108, 0.12)";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(this.x - tailX * 0.45, this.y - tailY * 0.45);
    ctx.lineTo(this.x + tailX, this.y + tailY);
    ctx.strokeStyle = "rgba(255, 183, 183, 0.34)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 92, 92, 0.92)";
    ctx.fill();
  }
}
