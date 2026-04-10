import { context } from "./dom.js";
import { updateParticleStatus } from "./status.js";
import { pointer, state } from "./state.js";

function drawEnemies() {
  for (const enemy of state.enemies) {
    enemy.draw(context);
  }
}

function drawPointerAttractor() {
  if (!pointer.active || !pointer.down) {
    return;
  }

  context.beginPath();
  context.arc(pointer.x, pointer.y, 12, 0, Math.PI * 2);
  context.fillStyle = "rgba(141, 196, 255, 0.24)";
  context.fill();

  context.beginPath();
  context.arc(pointer.x, pointer.y, 72, 0, Math.PI * 2);
  context.strokeStyle = "rgba(195, 236, 255, 0.18)";
  context.lineWidth = 1;
  context.stroke();
}

function enemyEliminatesParticle(particle) {
  for (const enemy of state.enemies) {
    if (enemy.touches(particle)) {
      return true;
    }
  }

  return false;
}

export function drawBackground() {
  context.clearRect(0, 0, state.width, state.height);
  context.fillStyle = "rgba(7, 9, 14, 0.12)";
  context.fillRect(0, 0, state.width, state.height);
}

export function renderFrame(now) {
  const dt = Math.min(2.2, (now - state.lastTime) / 16.6667 || 1);
  state.lastTime = now;

  drawBackground();

  for (const enemy of state.enemies) {
    enemy.update(dt);
  }

  const survivors = [];

  for (const particle of state.particles) {
    if (enemyEliminatesParticle(particle)) {
      continue;
    }

    particle.update(dt, now);
    particle.draw(context);
    survivors.push(particle);
  }

  if (survivors.length !== state.particles.length) {
    state.particles = survivors;
    updateParticleStatus();
  }

  drawEnemies();
  drawPointerAttractor();

  pointer.vx *= 0.82;
  pointer.vy *= 0.82;
  pointer.speed *= 0.82;
}
