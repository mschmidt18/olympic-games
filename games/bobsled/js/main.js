import { GAME_WIDTH, GAME_HEIGHT, COLORS, STATE, PLAY_PHASE, SLED, TRACK, PUSH, SCORING } from './constants.js';
import { InputManager } from './input.js';
import { generateTrack, SECTION_TYPE } from './track.js';
import { createSled, resetSled, updateSled, applyCrash } from './sled.js';
import { checkWallContact, applyWallEffects, checkCrash } from './collision.js';

// --- Canvas Setup ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// --- Input ---
const input = new InputManager(canvas);

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

// --- Debug HUD ---
function renderTrack() {
  for (let screenX = 0; screenX < GAME_WIDTH; screenX++) {
    const worldX = scrollX + screenX;
    const centerY = track.getCenterY(worldX);
    const halfWidth = track.getHalfWidth(worldX);

    // Ice surface
    ctx.fillStyle = COLORS.skyLight;
    const top = Math.floor(centerY - halfWidth);
    const height = Math.floor(halfWidth * 2);
    ctx.fillRect(screenX, top, 1, height);

    // Racing line zone (subtle indicator in curves)
    const curveDir = track.getCurveDirection(worldX);
    const curveInt = track.getCurveIntensity(worldX);
    if (curveInt > 0.1) {
      const racingLinePos = curveDir * SLED.racingLinePosition;
      const racingLineY = Math.floor(centerY + racingLinePos * halfWidth);
      ctx.fillStyle = COLORS.sky;
      ctx.fillRect(screenX, racingLineY - 1, 1, 2);
    }

    // Top wall - color by proximity to sled
    const wallColor = getWallColor(screenX, 'top');
    ctx.fillStyle = wallColor;
    ctx.fillRect(screenX, Math.floor(centerY - halfWidth - 4), 1, 4);

    // Bottom wall
    const wallColorB = getWallColor(screenX, 'bottom');
    ctx.fillStyle = wallColorB;
    ctx.fillRect(screenX, Math.floor(centerY + halfWidth), 1, 4);
  }
}

function getWallColor(screenX, wall) {
  // Only tint walls near the sled's X position
  const dist = Math.abs(screenX - SLED.screenX);
  if (dist > 20) return COLORS.darkGray;

  const absPos = Math.abs(sled.trackPosition);
  const nearWall = (wall === 'top' && sled.trackPosition > 0) ||
                   (wall === 'bottom' && sled.trackPosition < 0);

  if (!nearWall) return COLORS.darkGray;

  if (absPos > SLED.wallScrapeThreshold) {
    return COLORS.red;
  } else if (absPos > 0.7) {
    return COLORS.orange;
  }
  return COLORS.darkGray;
}

function renderSled() {
  const worldX = scrollX + sled.screenX;
  const centerY = track.getCenterY(worldX);
  const halfWidth = track.getHalfWidth(worldX);

  // Map trackPosition (-1..+1) to screen Y within channel
  const sledY = Math.floor(centerY + sled.trackPosition * halfWidth);

  if (!sled.visible) return; // flicker during invincibility

  // Runners (bottom of sled)
  ctx.fillStyle = COLORS.darkGray;
  ctx.fillRect(sled.screenX - 5, sledY + 2, 10, 1);

  // Body
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(sled.screenX - 4, sledY - 1, 8, 3);

  // Crew helmets
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(sled.screenX - 3, sledY - 3, 2, 2); // front crew
  ctx.fillRect(sled.screenX + 1, sledY - 3, 2, 2); // back crew

  // Lean tilt indicator on body
  if (sled.sprite === 'lean_up') {
    ctx.fillStyle = COLORS.redDark;
    ctx.fillRect(sled.screenX - 4, sledY - 2, 2, 1);
  } else if (sled.sprite === 'lean_down') {
    ctx.fillStyle = COLORS.redDark;
    ctx.fillRect(sled.screenX + 2, sledY + 1, 2, 1);
  }
}

function renderSpeedLines() {
  if (sled.speed <= 120) return;
  const count = Math.floor((sled.speed - 120) / 15) + 1;
  ctx.fillStyle = COLORS.white;
  for (let i = 0; i < count; i++) {
    const worldX = scrollX + sled.screenX;
    const centerY = track.getCenterY(worldX);
    const halfWidth = track.getHalfWidth(worldX);
    const y = centerY + (Math.random() * 2 - 1) * halfWidth * 0.8;
    const len = 4 + Math.random() * 8;
    const x = sled.screenX - 15 - Math.random() * 20;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(len), 1);
  }
}

function renderSparks(dt) {
  for (let i = sparkParticles.length - 1; i >= 0; i--) {
    const p = sparkParticles[i];
    p.life -= dt;
    if (p.life <= 0) {
      sparkParticles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 2, 2);
  }
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

function renderLeanIndicator() {
  const barY = GAME_HEIGHT - 10;
  const barX = 20;
  const barW = GAME_WIDTH - 40;
  const barH = 6;

  // Background
  ctx.fillStyle = COLORS.black;
  ctx.fillRect(barX, barY, barW, barH);

  // Optimal zone for current curve
  const worldX = scrollX + sled.screenX;
  const curveDir = track.getCurveDirection(worldX);
  const curveInt = track.getCurveIntensity(worldX);

  if (curveInt > 0.1) {
    // Optimal lean is in the direction of the curve
    const optimalLean = curveDir;
    const optCenter = barX + ((optimalLean + 1) / 2) * barW;
    const optWidth = Math.max(4, 20 * (1.0 - curveInt * 0.5));
    ctx.fillStyle = COLORS.greenBright;
    ctx.fillRect(Math.floor(optCenter - optWidth / 2), barY, Math.floor(optWidth), barH);
  }

  // Current lean marker
  const leanX = barX + ((sled.lean + 1) / 2) * barW;
  ctx.fillStyle = COLORS.white;
  ctx.fillRect(Math.floor(leanX) - 1, barY - 1, 3, barH + 2);

  // Border
  ctx.strokeStyle = COLORS.gray;
  ctx.strokeRect(barX, barY, barW, barH);
}

function renderHUD() {
  // Semi-transparent HUD bar
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, GAME_WIDTH, 14);

  ctx.font = '8px "Press Start 2P", monospace';

  // Speed
  const kmh = Math.floor(sled.speed * 0.5); // arbitrary conversion to km/h feel
  ctx.fillStyle = COLORS.sky;
  ctx.textAlign = 'center';
  ctx.fillText(`${kmh}km/h`, GAME_WIDTH / 2, 10);

  // Section
  const sectionIdx = track.getSectionIndex(scrollX + sled.screenX);
  const sectionType = track.getSectionType(scrollX + sled.screenX);
  ctx.fillStyle = COLORS.gold;
  ctx.textAlign = 'right';
  ctx.fillText(`${sectionIdx + 1}/20`, GAME_WIDTH - 4, 10);

  // Track position and lean (debug)
  ctx.fillStyle = COLORS.white;
  ctx.textAlign = 'left';
  ctx.font = '5px "Press Start 2P", monospace';
  ctx.fillText(`lean:${sled.lean.toFixed(2)} pos:${sled.trackPosition.toFixed(2)}`, 4, 10);

  // Section type
  ctx.fillStyle = COLORS.lightGray;
  ctx.textAlign = 'center';
  ctx.fillText(sectionType, GAME_WIDTH / 2, GAME_HEIGHT - 14);
}

function render(dt) {
  // Screen shake offset
  let shakeX = 0, shakeY = 0;
  if (screenShake > 0) {
    shakeX = Math.floor((Math.random() * 2 - 1) * screenShake);
    shakeY = Math.floor((Math.random() * 2 - 1) * screenShake);
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);

  // Background
  ctx.fillStyle = COLORS.black;
  ctx.fillRect(-4, -4, GAME_WIDTH + 8, GAME_HEIGHT + 8);

  renderTrack();
  renderSpeedLines();
  renderSled();
  renderSparks(dt);
  renderLeanIndicator();
  renderHUD();

  ctx.restore();

  // Crash flash overlay
  if (crashFlash > 0) {
    ctx.fillStyle = `rgba(248, 56, 0, ${crashFlash * 0.3})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
}

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

  // Clamp scroll
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
