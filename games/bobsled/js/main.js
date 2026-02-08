import { GAME_WIDTH, GAME_HEIGHT, COLORS, STATE, PLAY_PHASE, SLED, TRACK, PUSH, SCORING } from './constants.js';
import { InputManager } from './input.js';
import { generateTrack, SECTION_TYPE } from './track.js';

// --- Canvas Setup ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// --- Input ---
const input = new InputManager(canvas);

// --- Game State ---
let gameState = STATE.TITLE;

// --- Track (generate for verification) ---
const track = generateTrack();
let scrollX = 0;

// --- Stub: render track preview to verify track.js ---
function render() {
  ctx.fillStyle = COLORS.black;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Render track channel
  for (let screenX = 0; screenX < GAME_WIDTH; screenX++) {
    const worldX = scrollX + screenX;
    const centerY = track.getCenterY(worldX);
    const halfWidth = track.getHalfWidth(worldX);

    // Ice surface
    ctx.fillStyle = COLORS.skyLight;
    ctx.fillRect(screenX, Math.floor(centerY - halfWidth), 1, Math.floor(halfWidth * 2));

    // Top wall
    ctx.fillStyle = COLORS.darkGray;
    ctx.fillRect(screenX, Math.floor(centerY - halfWidth - 4), 1, 4);

    // Bottom wall
    ctx.fillRect(screenX, Math.floor(centerY + halfWidth), 1, 4);
  }

  // HUD
  ctx.fillStyle = COLORS.gold;
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BOBSLED - TRACK PREVIEW', GAME_WIDTH / 2, 12);

  const sectionIdx = track.getSectionIndex(scrollX + SLED.screenX);
  const sectionType = track.getSectionType(scrollX + SLED.screenX);
  ctx.fillStyle = COLORS.white;
  ctx.font = '5px "Press Start 2P", monospace';
  ctx.fillText(`Section ${sectionIdx + 1}/20  ${sectionType}`, GAME_WIDTH / 2, 228);
  ctx.fillText('LEFT/RIGHT to scroll', GAME_WIDTH / 2, 236);

  // Sled placeholder at fixed screen position
  const sledWorldX = scrollX + SLED.screenX;
  const sledCenterY = track.getCenterY(sledWorldX);
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(SLED.screenX - 5, Math.floor(sledCenterY) - 3, SLED.width, SLED.height);
}

function gameLoop() {
  // Allow scrolling through track with left/right for verification
  const state = input.getState();
  if (state.right) scrollX += 2;
  if (state.left) scrollX = Math.max(0, scrollX - 2);

  render();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
