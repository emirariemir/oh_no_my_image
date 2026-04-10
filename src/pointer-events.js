import { canvas } from "./dom.js";
import { setStatus, updateParticleStatus } from "./status.js";
import { pointer, state } from "./state.js";

export function setPointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  if (!pointer.active) {
    pointer.px = x;
    pointer.py = y;
    pointer.vx = 0;
    pointer.vy = 0;
    pointer.speed = 0;
  }

  pointer.vx = x - pointer.px;
  pointer.vy = y - pointer.py;
  pointer.speed = Math.hypot(pointer.vx, pointer.vy);
  pointer.px = x;
  pointer.py = y;
  pointer.x = x;
  pointer.y = y;
  pointer.active = true;
}

export function handlePointerLeave() {
  if (!pointer.down) {
    pointer.active = false;
    pointer.speed = 0;
  }
}

export function handlePointerDown(event) {
  if (!state.particles.length) {
    return;
  }

  if (event.button !== 0) {
    return;
  }

  setPointerPosition(event);
  pointer.down = true;
  canvas.setPointerCapture(event.pointerId);
  setStatus("Gravity pull engaged. Keep holding primary mouse to draw particles inward while enemies erase pixels on contact.");
}

export function handlePointerUp(event) {
  if (event.button !== 0) {
    return;
  }

  pointer.down = false;
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }

  updateParticleStatus();
}

export function handlePointerCancel(event) {
  pointer.down = false;
  pointer.speed = 0;
  pointer.active = false;

  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }

  updateParticleStatus();
}
