import { showIntro, rebuildEnemies, resetPointerState, setStatus, updateParticleStatus } from "./status.js";
import { state } from "./state.js";
import { Particle } from "./particle.js";
import { clamp, randomRange } from "./utils.js";

function resetImageState(message) {
  state.activeImage = null;
  state.particles = [];
  state.enemies = [];
  showIntro(true);
  setStatus(message);
}

export function loadFile(file) {
  if (!file) {
    return;
  }

  const image = new Image();
  const reader = new FileReader();

  resetPointerState();
  showIntro(true);
  setStatus(`Loading ${file.name}...`);

  reader.onload = (event) => {
    image.onload = () => {
      state.activeImage = image;
      state.imageName = file.name;
      buildParticlesFromImage(image);
    };

    image.onerror = () => {
      resetImageState("That image could not be decoded. Try a PNG, JPEG, or WebP file.");
    };

    image.src = event.target?.result ?? "";
  };

  reader.onerror = () => {
    resetImageState("The selected file could not be read.");
  };

  reader.readAsDataURL(file);
}

export function buildParticlesFromImage(image) {
  const maxDisplayWidth = Math.max(220, state.width * 0.58);
  const maxDisplayHeight = Math.max(180, state.height * 0.62);
  const scale = Math.min(maxDisplayWidth / image.width, maxDisplayHeight / image.height, 1);

  const displayWidth = Math.max(40, Math.floor(image.width * scale));
  const displayHeight = Math.max(40, Math.floor(image.height * scale));
  const targetCount = Math.min(12000, Math.max(2800, Math.floor((state.width * state.height) / 130)));
  const step = Math.max(3, Math.ceil(Math.sqrt((displayWidth * displayHeight) / targetCount)));
  const pixelGap = clamp(step * 0.12, 0.6, 1.3);
  const particleSize = Math.max(1.8, step - pixelGap);
  const spawnJitter = Math.min(1.2, step * 0.16);
  const offsetX = (state.width - displayWidth) / 2;
  const offsetY = (state.height - displayHeight) / 2;

  const offscreen = document.createElement("canvas");
  offscreen.width = displayWidth;
  offscreen.height = displayHeight;
  const offscreenContext = offscreen.getContext("2d", { willReadFrequently: true });
  if (!offscreenContext) {
    resetImageState("Canvas processing is unavailable in this browser.");
    return;
  }

  offscreenContext.drawImage(image, 0, 0, displayWidth, displayHeight);

  const { data } = offscreenContext.getImageData(0, 0, displayWidth, displayHeight);
  const particles = [];

  for (let y = 0; y < displayHeight; y += step) {
    for (let x = 0; x < displayWidth; x += step) {
      const sampleX = Math.min(displayWidth - 1, x + Math.floor(step * 0.5));
      const sampleY = Math.min(displayHeight - 1, y + Math.floor(step * 0.5));
      const index = (sampleY * displayWidth + sampleX) * 4;
      const alpha = data[index + 3];

      if (alpha < 40) {
        continue;
      }

      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = alpha / 255;

      particles.push(
        new Particle({
          x: offsetX + x + randomRange(-spawnJitter, spawnJitter),
          y: offsetY + y + randomRange(-spawnJitter, spawnJitter),
          color: `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`,
          size: particleSize,
          seed: particles.length * 0.173 + Math.random() * 8,
        }),
      );
    }
  }

  state.particles = particles;
  rebuildEnemies();
  showIntro(particles.length === 0);

  if (!particles.length) {
    setStatus("No visible pixels were detected in that image.");
    return;
  }

  updateParticleStatus();
}
