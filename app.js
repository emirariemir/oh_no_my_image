const canvas = document.getElementById("scene");
const context = canvas.getContext("2d", { alpha: true });

const fileInput = document.getElementById("imageUpload");
const regroupButton = document.getElementById("regroupButton");
const clearWellsButton = document.getElementById("clearWellsButton");
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
};

const state = {
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  width: window.innerWidth,
  height: window.innerHeight,
  particles: [],
  wells: [],
  activeImage: null,
  imageName: "",
  frame: 0,
  lastTime: performance.now(),
  sampleStep: 4,
};

class Particle {
  constructor({ x, y, color, size, seed }) {
    const angle = Math.random() * Math.PI * 2;
    const launch = 22 + Math.random() * 42;

    this.ox = x;
    this.oy = y;
    this.tx = x;
    this.ty = y;
    this.x = x + Math.cos(angle) * launch;
    this.y = y + Math.sin(angle) * launch;
    this.vx = Math.cos(angle) * (Math.random() * 1.8);
    this.vy = Math.sin(angle) * (Math.random() * 1.8);
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
    const spring = 0.074 * dt;
    const wander = Math.sin(time * 0.0012 + this.seed) * 0.01;
    const wobble = Math.cos(time * 0.0014 + this.seed * 2.3) * 0.01;

    this.applyForce((this.tx - this.x) * spring + wander, (this.ty - this.y) * spring + wobble);

    if (pointer.active && pointer.speed > 0.01) {
      const dx = this.x - pointer.x;
      const dy = this.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      const radius = 112 + Math.min(pointer.speed * 0.9, 160);

      if (distance < radius && distance > 0.001) {
        const influence = 1 - distance / radius;
        const impulse = influence * influence * (0.42 + pointer.speed * 0.012) * dt;
        const nx = dx / distance;
        const ny = dy / distance;

        this.applyForce(nx * impulse + pointer.vx * influence * 0.009, ny * impulse + pointer.vy * influence * 0.009);
      }
    }

    for (const well of state.wells) {
      const dx = well.x - this.x;
      const dy = well.y - this.y;
      const distanceSq = dx * dx + dy * dy + 24;
      const distance = Math.sqrt(distanceSq);

      if (distance < well.radius) {
        const falloff = 1 - distance / well.radius;
        const attract = (well.strength * falloff * dt) / distanceSq;
        const swirl = well.spin * attract * 0.38;

        this.applyForce(dx * attract, dy * attract);
        this.applyForce(-dy * swirl, dx * swirl);
      }
    }

    this.vx += this.ax;
    this.vy += this.ay;
    this.vx *= 0.91;
    this.vy *= 0.91;

    const maxVelocity = 15;
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > maxVelocity) {
      this.vx = (this.vx / speed) * maxVelocity;
      this.vy = (this.vy / speed) * maxVelocity;
    }

    this.x += this.vx;
    this.y += this.vy;
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

function loadFile(file) {
  if (!file) {
    return;
  }

  const image = new Image();
  const reader = new FileReader();

  reader.onload = (event) => {
    image.onload = () => {
      state.activeImage = image;
      state.imageName = file.name;
      buildParticlesFromImage(image);
    };

    image.src = event.target.result;
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
  const particleSize = Math.max(1.7, step * 0.88);
  const offsetX = (state.width - displayWidth) / 2;
  const offsetY = (state.height - displayHeight) / 2;

  const offscreen = document.createElement("canvas");
  offscreen.width = displayWidth;
  offscreen.height = displayHeight;
  const offscreenContext = offscreen.getContext("2d", { willReadFrequently: true });
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
          x: offsetX + x,
          y: offsetY + y,
          color: `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`,
          size: particleSize,
          seed: particles.length * 0.173 + Math.random() * 8,
        }),
      );
    }
  }

  state.particles = particles;
  state.wells = [];
  state.sampleStep = step;

  if (particles.length) {
    regroupParticles(false);
  }

  regroupButton.disabled = particles.length === 0;
  clearWellsButton.disabled = true;
  introCard.classList.toggle("is-hidden", particles.length > 0);

  if (!particles.length) {
    statusLabel.textContent = "No visible pixels were detected in that image.";
    return;
  }

  const shortName =
    state.imageName.length > 28 ? `${state.imageName.slice(0, 25).trimEnd()}...` : state.imageName;

  statusLabel.textContent = `${particles.length.toLocaleString()} particles from ${shortName || "image"}.`;
}

function regroupParticles(withVelocityBoost = true) {
  if (!state.particles.length) {
    return;
  }

  const ordered = [...state.particles].sort((a, b) => (a.oy === b.oy ? a.ox - b.ox : a.oy - b.oy));
  const positions = ordered.map((particle) => ({ x: particle.ox, y: particle.oy }));
  const neighborhood = Math.max(6, Math.floor(Math.sqrt(positions.length) * 0.22));

  for (let index = 0; index < ordered.length; index += 1) {
    const particle = ordered[index];
    const localOffset = Math.round((Math.random() - 0.5) * neighborhood * 2);
    const mappedIndex = clamp(index + localOffset, 0, positions.length - 1);
    const mapped = positions[mappedIndex];
    const jitter = state.sampleStep * 0.35;

    particle.tx = mapped.x + randomRange(-jitter, jitter);
    particle.ty = mapped.y + randomRange(-jitter, jitter);

    if (withVelocityBoost) {
      particle.vx += randomRange(-0.55, 0.55);
      particle.vy += randomRange(-0.55, 0.55);
    }
  }

  statusLabel.textContent = "Regrouped into a slightly wrong version of the image.";
}

function addGravityWell(x, y) {
  state.wells.push({
    x,
    y,
    radius: 180 + Math.random() * 90,
    strength: 850 + Math.random() * 450,
    spin: (Math.random() > 0.5 ? 1 : -1) * (0.7 + Math.random() * 0.9),
    life: 1,
  });

  if (state.wells.length > 5) {
    state.wells.shift();
  }

  clearWellsButton.disabled = false;
  statusLabel.textContent = `Gravity well planted at ${Math.round(x)}, ${Math.round(y)}.`;
}

function updateWells(dt) {
  for (let index = state.wells.length - 1; index >= 0; index -= 1) {
    const well = state.wells[index];
    well.life -= 0.0024 * dt;
    well.strength *= 0.9982;
    well.radius *= 0.9994;

    if (well.life <= 0.03 || well.radius < 30) {
      state.wells.splice(index, 1);
    }
  }

  clearWellsButton.disabled = state.wells.length === 0;
}

function drawBackground() {
  context.fillStyle = "rgba(7, 9, 14, 0.28)";
  context.fillRect(0, 0, state.width, state.height);
}

function drawWells() {
  for (const well of state.wells) {
    const alpha = Math.max(0, well.life * 0.42);
    context.beginPath();
    context.arc(well.x, well.y, 10 + (1 - well.life) * 12, 0, Math.PI * 2);
    context.fillStyle = `rgba(141, 196, 255, ${alpha})`;
    context.fill();

    context.beginPath();
    context.arc(well.x, well.y, well.radius * 0.28, 0, Math.PI * 2);
    context.strokeStyle = `rgba(195, 236, 255, ${alpha * 0.45})`;
    context.lineWidth = 1;
    context.stroke();
  }
}

function animate(now) {
  const dt = Math.min(2.2, (now - state.lastTime) / 16.6667 || 1);
  state.lastTime = now;
  state.frame += 1;

  drawBackground();
  updateWells(dt);

  for (const particle of state.particles) {
    particle.update(dt, now);
    particle.draw(context);
  }

  drawWells();

  pointer.vx *= 0.82;
  pointer.vy *= 0.82;
  pointer.speed *= 0.82;

  requestAnimationFrame(animate);
}

function clearWells() {
  state.wells = [];
  clearWellsButton.disabled = true;
  statusLabel.textContent = state.particles.length
    ? "Gravity wells cleared. The particles are settling."
    : "Awaiting an upload.";
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

regroupButton.addEventListener("click", () => {
  regroupParticles(true);
});

clearWellsButton.addEventListener("click", clearWells);

canvas.addEventListener("pointermove", setPointerPosition);
canvas.addEventListener("pointerleave", () => {
  pointer.active = false;
});
canvas.addEventListener("pointerdown", (event) => {
  if (!state.particles.length) {
    return;
  }

  setPointerPosition(event);
  addGravityWell(pointer.x, pointer.y);
});

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
drawBackground();
requestAnimationFrame(animate);
