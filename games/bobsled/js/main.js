import { GAME_WIDTH, GAME_HEIGHT, COLORS, STATE, PLAY_PHASE, SLED, TRACK, PUSH, SCORING } from './constants.js';
import { InputManager } from './input.js';
import { Renderer } from './renderer.js';
import { generateTrack, SECTION_TYPE } from './track.js';
import { createSled, resetSled, updateSled, applyCrash } from './sled.js';
import { checkWallContact, applyWallEffects, checkCrash } from './collision.js';

// --- Canvas Setup ---
const canvas = document.getElementById('game-canvas');

// --- Input & Renderer ---
const input = new InputManager(canvas);
const renderer = new Renderer(canvas);

// --- Game State ---
let gameState = STATE.TITLE;

// --- Track & Sled ---
let track = generateTrack();
let scrollX = 0;
let sled = createSled();
let lastTime = 0;

// --- Collision visual state ---
let screenShake = 0;
let sparkParticles = [];
let crashFlash = 0;

// --- Timing ---
let blinkTimer = 0;

function update(dt) {
  const inputState = input.getState();

  // Update sled physics
  updateSled(sled, dt, inputState, track, scrollX);

  // Check wall contact and apply effects
  const wallContact = checkWallContact(sled);
  const wallEffect = applyWallEffects(sled);

  if (wallEffect === 'bounce') {
    screenShake = 2;
    spawnSparks(wallContact.side);
  } else if (wallEffect === 'scrape') {
    screenShake = 1;
    if (Math.random() < 0.3) spawnSparks(wallContact.side);
  }

  // Check for crash
  if (checkCrash(sled, track, scrollX)) {
    applyCrash(sled);
    screenShake = 4;
    crashFlash = 1.0;
  }

  // Advance scroll based on sled speed
  scrollX += sled.speed * dt;
  scrollX = Math.max(0, scrollX);

  // Decay screen shake
  if (screenShake > 0) {
    screenShake *= 0.9;
    if (screenShake < 0.1) screenShake = 0;
  }

  // Decay crash flash
  if (crashFlash > 0) {
    crashFlash -= dt * 2;
    if (crashFlash < 0) crashFlash = 0;
  }

  blinkTimer += dt;
}

function spawnSparks(side) {
  const worldX = scrollX + sled.screenX;
  const centerY = track.getCenterY(worldX);
  const halfWidth = track.getHalfWidth(worldX);
  const y = side === 'top'
    ? centerY - halfWidth
    : centerY + halfWidth;

  for (let i = 0; i < 4; i++) {
    sparkParticles.push({
      x: sled.screenX + Math.random() * 6 - 3,
      y: y + Math.random() * 4 - 2,
      vx: -20 - Math.random() * 30,
      vy: (Math.random() - 0.5) * 40,
      life: 0.2 + Math.random() * 0.2,
      color: Math.random() > 0.5 ? COLORS.yellow : COLORS.orange,
    });
  }
}

function render(dt) {
  renderer.clear();

  // Screen shake
  const shakeApplied = renderer.applyScreenShake(screenShake);

  // Draw track
  renderer.drawTrack(track, scrollX, sled);

  // Curve arrows and section markers
  renderer.drawCurveArrows(track, scrollX);
  renderer.drawSectionMarkers(track, scrollX);

  // Finish line
  renderer.drawFinishLine(track, scrollX);

  // Speed lines
  renderer.drawSpeedLines(sled, track, scrollX);

  // Sled
  renderer.drawSled(sled, track, scrollX);

  // Sparks
  renderer.drawSparks(sparkParticles, dt);

  // Lean indicator
  renderer.drawLeanIndicator(sled, track, scrollX);

  // HUD
  const sectionIdx = track.getSectionIndex(scrollX + sled.screenX);
  renderer.drawHUD(0, sled.speed, sectionIdx, TRACK.sectionCount);

  renderer.restoreScreenShake(shakeApplied);

  // Crash flash overlay (outside shake context)
  renderer.drawCrashFlash(crashFlash);
}

function gameLoop(timestamp) {
  if (lastTime === 0) lastTime = timestamp;
  let dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  // Cap dt to prevent spiral of death
  dt = Math.min(dt, 0.05);

  update(dt);
  render(dt);
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
