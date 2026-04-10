import { canvas, context, fileInput } from "./src/dom.js";
import { buildParticlesFromImage, loadFile } from "./src/image-processing.js";
import {
  handlePointerCancel,
  handlePointerDown,
  handlePointerLeave,
  handlePointerUp,
  setPointerPosition,
} from "./src/pointer-events.js";
import { drawBackground, renderFrame } from "./src/rendering.js";
import { state } from "./src/state.js";

function resizeCanvas() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(state.width * state.dpr);
  canvas.height = Math.floor(state.height * state.dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;
  context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

  if (state.activeImage) {
    buildParticlesFromImage(state.activeImage);
  }
}

function animate(now) {
  renderFrame(now);
  requestAnimationFrame(animate);
}

fileInput.addEventListener("change", (event) => {
  loadFile(event.target.files?.[0]);
  event.target.value = "";
});

canvas.addEventListener("pointermove", setPointerPosition);
canvas.addEventListener("pointerleave", handlePointerLeave);
canvas.addEventListener("pointerdown", handlePointerDown);
canvas.addEventListener("pointerup", handlePointerUp);
canvas.addEventListener("pointercancel", handlePointerCancel);

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
drawBackground();
requestAnimationFrame(animate);
