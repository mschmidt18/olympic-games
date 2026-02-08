import { GAME_WIDTH, GAME_HEIGHT, COLORS, STATE, PLAY_PHASE, SLED, TRACK, PUSH, SCORING } from './constants.js';
import { InputManager } from './input.js';

// --- Canvas Setup ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// --- Input ---
const input = new InputManager(canvas);

// --- Game State ---
let gameState = STATE.TITLE;

// --- Stub: render a blank canvas to verify setup ---
function render() {
  ctx.fillStyle = COLORS.black;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.fillStyle = COLORS.gold;
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BOBSLED', GAME_WIDTH / 2, 100);
  ctx.fillStyle = COLORS.white;
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.fillText('SCAFFOLD READY', GAME_WIDTH / 2, 130);

  // Show input state for verification
  const state = input.getState();
  ctx.fillStyle = COLORS.skyLight;
  ctx.font = '5px "Press Start 2P", monospace';
  let y = 160;
  if (state.left) { ctx.fillText('LEFT', GAME_WIDTH / 2, y); y += 10; }
  if (state.right) { ctx.fillText('RIGHT', GAME_WIDTH / 2, y); y += 10; }
  if (state.action) { ctx.fillText('ACTION', GAME_WIDTH / 2, y); y += 10; }
}

function gameLoop() {
  render();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
