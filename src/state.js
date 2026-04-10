import { statusLabel } from "./dom.js";

export const pointer = {
  x: 0,
  y: 0,
  px: 0,
  py: 0,
  vx: 0,
  vy: 0,
  speed: 0,
  active: false,
  down: false,
};

export const state = {
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  width: window.innerWidth,
  height: window.innerHeight,
  particles: [],
  enemies: [],
  activeImage: null,
  imageName: "",
  lastTime: performance.now(),
  statusText: statusLabel.textContent,
};
