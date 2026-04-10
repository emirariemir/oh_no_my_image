import { introCard, statusLabel } from "./dom.js";
import { Enemy } from "./enemy.js";
import { state, pointer } from "./state.js";
import { clamp } from "./utils.js";

export function resetPointerState() {
  pointer.x = 0;
  pointer.y = 0;
  pointer.px = 0;
  pointer.py = 0;
  pointer.vx = 0;
  pointer.vy = 0;
  pointer.speed = 0;
  pointer.active = false;
  pointer.down = false;
}

export function setStatus(text) {
  if (state.statusText === text) {
    return;
  }

  state.statusText = text;
  statusLabel.textContent = text;
}

export function showIntro(isVisible) {
  introCard.classList.toggle("is-hidden", !isVisible);
}

function getShortImageName() {
  return state.imageName.length > 28 ? `${state.imageName.slice(0, 25).trimEnd()}...` : state.imageName;
}

function getEnemyCount(particleCount) {
  return clamp(Math.round(particleCount / 2200), 2, 7);
}

export function rebuildEnemies() {
  if (!state.particles.length) {
    state.enemies = [];
    return;
  }

  state.enemies = Array.from({ length: getEnemyCount(state.particles.length) }, () => new Enemy());
}

export function updateParticleStatus() {
  if (!state.activeImage) {
    setStatus("Awaiting an upload.");
    return;
  }

  const shortName = getShortImageName() || "image";

  if (!state.particles.length) {
    setStatus(`All particles from ${shortName} were eliminated. Upload another image to restart.`);
    return;
  }

  setStatus(
    `${state.particles.length.toLocaleString()} particles remain in ${shortName}. ${state.enemies.length} enemies are roaming. Move through them to disturb, hold primary mouse to attract.`,
  );
}
