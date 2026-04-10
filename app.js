const canvas = document.getElementById("scene");
const context = canvas.getContext("2d", { alpha: true });

const fileInput = document.getElementById("imageUpload");
const introCard = document.getElementById("intro");
const statusLabel = document.getElementById("statusLabel");

const pointer = {
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

const state = {
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  width: window.innerWidth,
  height: window.innerHeight,
  particles: [],
  activeImage: null,
  imageName: "",
  lastTime: performance.now(),
};

class Particle {
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

function resetPointerState() {
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

function loadFile(file) {
  if (!file) {
    return;
  }

  const image = new Image();
  const reader = new FileReader();

  resetPointerState();
  introCard.classList.remove("is-hidden");
  statusLabel.textContent = `Loading ${file.name}...`;

  reader.onload = (event) => {
    image.onload = () => {
      state.activeImage = image;
      state.imageName = file.name;
      buildParticlesFromImage(image);
    };

    image.onerror = () => {
      state.activeImage = null;
      state.particles = [];
      introCard.classList.remove("is-hidden");
      statusLabel.textContent = "That image could not be decoded. Try a PNG, JPEG, or WebP file.";
    };

    image.src = event.target?.result ?? "";
  };

  reader.onerror = () => {
    state.activeImage = null;
    state.particles = [];
    introCard.classList.remove("is-hidden");
    statusLabel.textContent = "The selected file could not be read.";
  };

  reader.readAsDataURL(file);
}

function buildParticlesFromImage(image) {
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
    state.particles = [];
    introCard.classList.remove("is-hidden");
    statusLabel.textContent = "Canvas processing is unavailable in this browser.";
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

  introCard.classList.toggle("is-hidden", particles.length > 0);

  if (!particles.length) {
    statusLabel.textContent = "No visible pixels were detected in that image.";
    return;
  }

  const shortName =
    state.imageName.length > 28 ? `${state.imageName.slice(0, 25).trimEnd()}...` : state.imageName;

  statusLabel.textContent = `${particles.length.toLocaleString()} particles from ${shortName || "image"}. Move through them to disturb, hold primary mouse to attract.`;
}

function drawBackground() {
  context.clearRect(0, 0, state.width, state.height);
  context.fillStyle = "rgba(7, 9, 14, 0.12)";
  context.fillRect(0, 0, state.width, state.height);
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

function animate(now) {
  const dt = Math.min(2.2, (now - state.lastTime) / 16.6667 || 1);
  state.lastTime = now;

  drawBackground();

  for (const particle of state.particles) {
    particle.update(dt, now);
    particle.draw(context);
  }

  drawPointerAttractor();

  pointer.vx *= 0.82;
  pointer.vy *= 0.82;
  pointer.speed *= 0.82;

  requestAnimationFrame(animate);
}

function setPointerPosition(event) {
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

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

fileInput.addEventListener("change", (event) => {
  loadFile(event.target.files?.[0]);
  event.target.value = "";
});

canvas.addEventListener("pointermove", setPointerPosition);
canvas.addEventListener("pointerleave", () => {
  if (!pointer.down) {
    pointer.active = false;
    pointer.speed = 0;
  }
});
canvas.addEventListener("pointerdown", (event) => {
  if (!state.particles.length) {
    return;
  }

  if (event.button !== 0) {
    return;
  }

  setPointerPosition(event);
  pointer.down = true;
  canvas.setPointerCapture(event.pointerId);
  statusLabel.textContent = "Gravity pull engaged. Keep holding primary mouse to draw particles inward.";
});
canvas.addEventListener("pointerup", (event) => {
  if (event.button !== 0) {
    return;
  }

  pointer.down = false;
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }

  if (state.particles.length) {
    statusLabel.textContent = "Gravity pull released. Move through the particles or hold primary mouse to attract them again.";
  }
});
canvas.addEventListener("pointercancel", (event) => {
  pointer.down = false;
  pointer.speed = 0;
  pointer.active = false;
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
});

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
drawBackground();
requestAnimationFrame(animate);
