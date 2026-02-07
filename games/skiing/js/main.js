import { GAME_WIDTH, GAME_HEIGHT, COLORS, STATE, COURSE, SCORING } from './constants.js';
import { Renderer } from './renderer.js';
import { InputManager } from './input.js';
import { Player } from './player.js';
import { Course } from './course.js';
import { checkGatePass, checkObstacleCollision } from './collision.js';

// --- Game State ---
let gameState = STATE.TITLE;
let canvas, renderer, input, player, course;

// Timing
let gameTime = 0;
let blinkTimer = 0;
let countdownTimer = 0;
let countdownCount = 3;
let finishTimer = 0;

// Scrolling
let scrollY = 0;
let scrollSpeed = 0;

// Scoring
let score = 0;
let gatesPassed = 0;
let gatesMissed = 0;
let comboCount = 0;
let penaltyTime = 0;

// High score
let highScore = parseInt(localStorage.getItem('skiing_highScore') || '0', 10);
let isNewHighScore = false;

// Results menu
let resultsSelection = 0; // 0=PLAY AGAIN, 1=SHARE, 2=BACK TO MENU
let resultsInputDelay = 0;
const RESULTS_OPTIONS = 3;

// Track which obstacles have already hit the player
let hitObstacles = new Set();

// --- Initialization ---
function init() {
  canvas = document.getElementById('game-canvas');
  renderer = new Renderer(canvas);
  input = new InputManager(canvas);
  player = new Player();
  course = new Course();

  // Handle ESC key for menu
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (gameState === STATE.RESULTS) {
        window.location.href = '../../index.html';
      }
    }
  });

  // Start loop
  requestAnimationFrame(gameLoop);
}

// --- Game Loop ---
let lastTime = 0;

function gameLoop(timestamp) {
  const deltaTime = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  const dt = Math.min(deltaTime, 0.05); // Cap to prevent spiral of death

  blinkTimer += dt;
  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

// --- Update ---
function update(dt) {
  switch (gameState) {
    case STATE.TITLE:
      updateTitle(dt);
      break;
    case STATE.COUNTDOWN:
      updateCountdown(dt);
      break;
    case STATE.PLAYING:
      updatePlaying(dt);
      break;
    case STATE.FINISH:
      updateFinish(dt);
      break;
    case STATE.RESULTS:
      updateResults(dt);
      break;
  }
}

function updateTitle(dt) {
  if (input.consumeAction()) {
    startGame();
  }
}

function startGame() {
  // Reset everything
  player.reset();
  course.generate();
  scrollY = 0;
  scrollSpeed = 0;
  gameTime = 0;
  score = 0;
  gatesPassed = 0;
  gatesMissed = 0;
  comboCount = 0;
  penaltyTime = 0;
  hitObstacles = new Set();
  countdownTimer = 0;
  countdownCount = 3;
  gameState = STATE.COUNTDOWN;
}

function updateCountdown(dt) {
  countdownTimer += dt;
  if (countdownTimer >= 1) {
    countdownTimer -= 1;
    countdownCount--;
    if (countdownCount < 0) {
      gameState = STATE.PLAYING;
      scrollSpeed = COURSE.scrollSpeedBase;
    }
  }
}

function updatePlaying(dt) {
  // Update player movement
  player.update(dt, input.state);

  // Accelerate scroll speed gradually
  if (scrollSpeed < COURSE.scrollSpeedMax) {
    scrollSpeed = Math.min(COURSE.scrollSpeedMax, scrollSpeed + COURSE.scrollAcceleration * dt);
  }

  // Scroll the world
  scrollY += scrollSpeed * dt;
  gameTime += dt;

  // Update gate flash timers
  for (const gate of course.gates) {
    if (gate.flashTimer > 0) {
      gate.flashTimer -= dt;
    }
  }

  // Check gate passes
  const visibleGates = course.getVisibleGates(scrollY);
  for (const gate of visibleGates) {
    const result = checkGatePass(player, gate, scrollY);
    if (result === 'passed') {
      gatesPassed++;
      comboCount++;
      const comboIdx = Math.min(comboCount - 1, SCORING.comboMultipliers.length - 1);
      const multiplier = SCORING.comboMultipliers[comboIdx];
      const points = Math.floor(SCORING.gatePass * multiplier);
      score += points;
    } else if (result === 'missed') {
      gatesMissed++;
      comboCount = 0;
      score = Math.max(0, score + SCORING.gateMiss);
      penaltyTime += SCORING.missTimePenalty;
    }
  }

  // Check obstacle collisions
  if (!player.isInvincible) {
    const visibleObstacles = course.getVisibleObstacles(scrollY);
    for (let i = 0; i < visibleObstacles.length; i++) {
      const obs = visibleObstacles[i];
      const obsId = `${obs.x}-${obs.worldY}`;
      if (hitObstacles.has(obsId)) continue;

      if (checkObstacleCollision(player, obs, scrollY)) {
        hitObstacles.add(obsId);
        score = Math.max(0, score + SCORING.obstacleHit);
        penaltyTime += SCORING.hitTimePenalty;
        scrollSpeed *= SCORING.hitSpeedReduction;
        comboCount = 0;
        player.makeInvincible();
        break;
      }
    }
  }

  // Check finish
  const playerWorldY = scrollY + player.screenY;
  if (playerWorldY >= course.finishY) {
    gameState = STATE.FINISH;
    finishTimer = 0;
  }
}

function updateFinish(dt) {
  // Decelerate
  scrollSpeed = Math.max(0, scrollSpeed - 80 * dt);
  scrollY += scrollSpeed * dt;
  player.update(dt, { left: false, right: false });

  finishTimer += dt;
  if (finishTimer > 2.0) {
    // Check high score
    isNewHighScore = score > highScore;
    if (isNewHighScore) {
      highScore = score;
      localStorage.setItem('skiing_highScore', String(highScore));
    }

    gameState = STATE.RESULTS;
    resultsSelection = 0;
    resultsInputDelay = 0.5;
    blinkTimer = 0;
  }
}

function updateResults(dt) {
  resultsInputDelay -= dt;
  if (resultsInputDelay > 0) {
    // Drain any pending inputs during delay
    input.consumeAction();
    input.consumeUp();
    input.consumeDown();
    input.getLastActionPos();
    return;
  }

  // Keyboard navigation
  if (input.consumeUp()) {
    resultsSelection = (resultsSelection - 1 + RESULTS_OPTIONS) % RESULTS_OPTIONS;
  }
  if (input.consumeDown()) {
    resultsSelection = (resultsSelection + 1) % RESULTS_OPTIONS;
  }

  if (input.consumeAction()) {
    const pos = input.getLastActionPos();
    if (pos) {
      // Map touch/click position to canvas coordinates for option targeting
      const rect = canvas.getBoundingClientRect();
      const canvasY = ((pos.y - rect.top) / rect.height) * GAME_HEIGHT;
      // Option zones based on rendered Y positions
      if (canvasY >= 164 && canvasY < 184) {
        resultsSelection = 0; // PLAY AGAIN
      } else if (canvasY >= 184 && canvasY < 204) {
        resultsSelection = 1; // SHARE
      } else if (canvasY >= 204 && canvasY < 224) {
        resultsSelection = 2; // BACK TO MENU
      }
    }

    executeResultsAction();
  }
}

function executeResultsAction() {
  switch (resultsSelection) {
    case 0:
      startGame();
      break;
    case 1:
      shareScore();
      break;
    case 2:
      window.location.href = '../../index.html';
      break;
  }
}

function shareScore() {
  const finalTime = gameTime + penaltyTime;
  const minutes = Math.floor(finalTime / 60);
  const seconds = Math.floor(finalTime % 60);
  const hundredths = Math.floor((finalTime % 1) * 100);
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;

  const shareText = `Downhill Skiing - Winter Olympics 2026\n` +
    `Score: ${score} | Time: ${timeStr}\n` +
    `Gates: ${gatesPassed}/${COURSE.totalGates}` +
    (isNewHighScore ? ` | NEW HIGH SCORE!` : '') +
    `\nCan you beat my score?`;

  if (navigator.share) {
    navigator.share({
      title: 'Downhill Skiing - Winter Olympics 2026',
      text: shareText,
    }).catch(() => {
      // User cancelled or share failed - do nothing
    });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(shareText).then(() => {
      renderer.showCopiedMessage();
    }).catch(() => {
      // Clipboard failed - do nothing
    });
  }
}

// --- Render ---
function render() {
  renderer.clear();

  switch (gameState) {
    case STATE.TITLE:
      renderer.drawTitle(blinkTimer);
      break;

    case STATE.COUNTDOWN:
      renderPlayfield();
      renderer.drawCountdown(countdownCount);
      break;

    case STATE.PLAYING:
      renderPlayfield();
      renderer.drawHUD(gameTime + penaltyTime, gatesPassed, COURSE.totalGates, score, getComboMultiplier());
      break;

    case STATE.FINISH:
      renderPlayfield();
      renderer.drawHUD(gameTime + penaltyTime, gatesPassed, COURSE.totalGates, score, getComboMultiplier());
      break;

    case STATE.RESULTS:
      renderPlayfield();
      renderer.drawResults(
        gameTime + penaltyTime,
        gatesPassed,
        gatesMissed,
        COURSE.totalGates,
        score,
        highScore,
        isNewHighScore,
        resultsSelection,
        blinkTimer
      );
      break;
  }
}

function renderPlayfield() {
  // Draw decorations (snow texture)
  renderer.drawDecorations(course.getVisibleDecorations(scrollY), scrollY);

  // Draw course boundaries
  renderer.drawCourseBoundaries(scrollY);

  // Draw finish line
  renderer.drawFinishLine(course.finishY, scrollY);

  // Draw obstacles (behind gates)
  const visibleObstacles = course.getVisibleObstacles(scrollY);
  for (const obs of visibleObstacles) {
    renderer.drawObstacle(obs, scrollY);
  }

  // Draw gates
  const visibleGates = course.getVisibleGates(scrollY);
  for (const gate of visibleGates) {
    renderer.drawGate(gate, scrollY);
  }

  // Draw player
  renderer.drawPlayer(player);
}

function getComboMultiplier() {
  if (comboCount <= 0) return 1;
  const idx = Math.min(comboCount - 1, SCORING.comboMultipliers.length - 1);
  return SCORING.comboMultipliers[idx];
}

// --- Start ---
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
