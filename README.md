# Oh No My Image

This is a personal project built to explore image uploads, pixel transformation, and lightweight 2D physics in the browser. The app turns an uploaded image into a field of colored particles, then lets pointer input and roaming enemies disturb and erase that image over time.

## How it works

The app starts in `app.js`, where it wires up the canvas, file input, pointer events, resize handling, and the animation loop.

When a user uploads an image, `src/image-processing.js` reads the file with `FileReader`, draws it onto an offscreen canvas, samples visible pixels, and converts those samples into `Particle` instances. Each particle stores its position, velocity, size, seed, and sampled color.

During each animation frame, `src/rendering.js` clears the canvas, updates enemies, updates particles, removes particles touched by enemies, and redraws the current scene. Pointer movement pushes particles away based on cursor velocity, and holding the primary mouse button creates a local attractor that pulls particles inward with a small swirl effect.

## Code structure

- `index.html`: Shell markup for the canvas, upload controls, intro card, and status area.
- `styles.css`: Visual styling for the interface and layout.
- `app.js`: Application bootstrap, event wiring, resize logic, and animation loop startup.
- `src/dom.js`: Shared DOM element lookups.
- `src/state.js`: Central runtime state for canvas size, particles, enemies, image metadata, timing, and pointer state.
- `src/image-processing.js`: Image loading, offscreen pixel sampling, particle creation, and image reset behavior.
- `src/particle.js`: Particle physics and drawing behavior.
- `src/enemy.js`: Enemy spawning, movement, collision checks, and rendering.
- `src/pointer-events.js`: Pointer tracking, pointer capture, and interaction state changes.
- `src/rendering.js`: Frame update/render pipeline and particle elimination pass.
- `src/status.js`: Intro visibility, HUD text updates, pointer reset, and enemy count rebuilding.
- `src/utils.js`: Small shared helpers such as `clamp` and `randomRange`.

## Interaction model

- Move the pointer through the particle image to disturb nearby pixels.
- Hold primary mouse to activate an attractor that pulls particles toward the pointer.
- Enemies continuously roam across the canvas and eliminate particles on contact.
- Uploading a new image rebuilds the particle field from the new pixel data.
