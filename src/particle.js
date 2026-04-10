import { pointer, state } from "./state.js";

export class Particle {
  constructor({ x, y, color, size, seed }) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    this.color = color;
    this.size = size;
    this.seed = seed;
  }

  applyForce(x, y) {
    this.ax += x;
    this.ay += y;
  }

  update(dt, time) {
    if (pointer.active && pointer.speed > 0.01) {
      const dx = this.x - pointer.x;
      const dy = this.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      const radius = 36 + Math.min(pointer.speed * 2.4, 120);

      if (distance < radius && distance > 0.001) {
        const influence = 1 - distance / radius;
        const impulse = influence * influence * (0.16 + pointer.speed * 0.045) * dt;
        const nx = dx / distance;
        const ny = dy / distance;

        this.applyForce(
          nx * impulse + pointer.vx * influence * 0.028,
          ny * impulse + pointer.vy * influence * 0.028,
        );
      }
    }

    if (pointer.active && pointer.down) {
      const dx = pointer.x - this.x;
      const dy = pointer.y - this.y;
      const distanceSq = dx * dx + dy * dy + 48;
      const distance = Math.sqrt(distanceSq);
      const radius = 240;

      if (distance < radius) {
        const influence = 1 - distance / radius;
        const pull = influence * influence * 0.34 * dt;
        const swirl = Math.sin(time * 0.0015 + this.seed * 3.1) * 0.05 * influence * dt;

        this.applyForce((dx / distance) * pull, (dy / distance) * pull);
        this.applyForce((-dy / distance) * swirl, (dx / distance) * swirl);
      }
    }

    this.vx += this.ax;
    this.vy += this.ay;
    this.vx *= 0.988;
    this.vy *= 0.988;

    const maxVelocity = 18;
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > maxVelocity) {
      this.vx = (this.vx / speed) * maxVelocity;
      this.vy = (this.vy / speed) * maxVelocity;
    }

    this.x += this.vx;
    this.y += this.vy;

    const maxX = state.width - this.size;
    const maxY = state.height - this.size;

    if (this.x < 0) {
      this.x = 0;
      this.vx *= -0.35;
    } else if (this.x > maxX) {
      this.x = maxX;
      this.vx *= -0.35;
    }

    if (this.y < 0) {
      this.y = 0;
      this.vy *= -0.35;
    } else if (this.y > maxY) {
      this.y = maxY;
      this.vy *= -0.35;
    }

    this.ax = 0;
    this.ay = 0;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}
