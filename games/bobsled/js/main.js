import { GAME_HEIGHT, COLORS, STATE, PLAY_PHASE, SLED, TRACK, PUSH, SCORING } from './constants.js';
import { InputManager } from './input.js';
import { Renderer } from './renderer.js';
import { generateTrack } from './track.js';
import { createSled, updateSled, applyCrash } from './sled.js';
import { checkWallContact, applyWallEffects, checkCrash } from './collision.js';

// --- Canvas Setup ---
let canvas, renderer, input;

// --- Game State ---
let gameState = STATE.TITLE;
let playPhase = PLAY_PHASE.PUSH;

// --- Track & Sled ---
let track = null;
let scrollX = 0;
let sled = null;

// --- Timing ---
let lastTime = 0;
let blinkTimer = 0;
let gameTime = 0;
let countdownTimer = 0;
let countdownCount = 3;
let finishTimer = 0;

// --- Push Start ---
let pushTimer = 0;
let pushTaps = 0;
let pushMeterFill = 0;
let pushRating = '';
let pushSpeedBonus = 0;

// --- Collision visual state ---
let screenShake = 0;
let sparkParticles = [];
let crashFlash = 0;

// --- Scoring ---
let crashes = 0;
let sectionGrades = [];       // Array of 'S', 'A', 'B', 'C' per section
let sectionRacingTime = [];   // Time on racing line per section (seconds)
let sectionTotalTime = [];    // Total time in each section (seconds)
let sectionWallContact = [];  // Whether wall contact occurred in section
let lastSectionIndex = 0;
let stylePoints = 0;

// --- High Score ---
let highScore = null;
let isNewBest = false;
const HS_KEY = 'bobsled_highScore';

// --- Results Menu ---
let resultsSelection = 0;
let resultsInputDelay = 0;
const RESULTS_OPTIONS = 3;

// --- Initialization ---
function init() {
  canvas = document.getElementById('game-canvas');
  renderer = new Renderer(canvas);
  input = new InputManager(canvas);
  track = generateTrack();
  sled = createSled();

  // Load high score
  const stored = localStorage.getItem(HS_KEY);
  highScore = stored !== null ? parseFloat(stored) : null;

  // ESC key for menu
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (gameState === STATE.RESULTS) {
        window.location.href = '../../index.html';
      }
    }
  });

  requestAnimationFrame(gameLoop);
}

// --- Game Loop ---
function gameLoop(timestamp) {
  if (lastTime === 0) lastTime = timestamp;
  let dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  // Cap dt to prevent spiral of death
  dt = Math.min(dt, 0.05);

  blinkTimer += dt;
  update(dt);
  render(dt);
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
      if (playPhase === PLAY_PHASE.PUSH) {
        updatePush(dt);
      } else {
        updateRacing(dt);
      }
      break;
    case STATE.FINISH:
      updateFinish(dt);
      break;
    case STATE.RESULTS:
      updateResults(dt);
      break;
  }
}

// --- TITLE ---
function updateTitle(dt) {
  if (input.consumeAction()) {
    startGame();
  }
}

function startGame() {
  // Generate new track
  track = generateTrack();
  sled = createSled();
  scrollX = 0;
  gameTime = 0;
  countdownTimer = 0;
  countdownCount = 3;
  finishTimer = 0;

  // Reset push
  pushTimer = 0;
  pushTaps = 0;
  pushMeterFill = 0;
  pushRating = '';
  pushSpeedBonus = 0;

  // Reset visuals
  screenShake = 0;
  sparkParticles = [];
  crashFlash = 0;

  // Reset scoring
  crashes = 0;
  sectionGrades = [];
  sectionRacingTime = new Array(TRACK.sectionCount).fill(0);
  sectionTotalTime = new Array(TRACK.sectionCount).fill(0);
  sectionWallContact = new Array(TRACK.sectionCount).fill(false);
  lastSectionIndex = 0;
  stylePoints = 0;
  isNewBest = false;

  playPhase = PLAY_PHASE.PUSH;
  gameState = STATE.COUNTDOWN;
}

// --- COUNTDOWN ---
function updateCountdown(dt) {
  countdownTimer += dt;
  if (countdownTimer >= 1) {
    countdownTimer -= 1;
    countdownCount--;
    if (countdownCount < 0) {
      gameState = STATE.PLAYING;
      playPhase = PLAY_PHASE.PUSH;
      pushTimer = 0;
      pushTaps = 0;
      pushMeterFill = 0;
      pushRating = '';
    }
  }
}

// --- PUSH START ---
function updatePush(dt) {
  pushTimer += dt;

  // Count taps
  if (input.consumeAction()) {
    pushTaps++;
    pushMeterFill = Math.min(1.0, pushTaps / PUSH.maxTaps);
  }

  // Push phase ends after PUSH.duration
  if (pushTimer >= PUSH.duration) {
    // Calculate rating and speed bonus
    const fill = pushMeterFill;
    if (fill >= PUSH.ratingThresholds.perfect) {
      pushRating = 'PERFECT';
    } else if (fill >= PUSH.ratingThresholds.great) {
      pushRating = 'GREAT';
    } else if (fill >= PUSH.ratingThresholds.good) {
      pushRating = 'GOOD';
    } else {
      pushRating = 'POOR';
    }

    pushSpeedBonus = fill * PUSH.speedBonusMax;
    sled.speed = SLED.speedBase + pushSpeedBonus;

    // Transition to racing
    playPhase = PLAY_PHASE.RACING;
  }
}

// --- RACING ---
function updateRacing(dt) {
  const inputState = input.getState();
  // Drain any pending action presses so they don't carry over
  input.consumeAction();

  // Update game time
  gameTime += dt;

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
    crashes++;
    // Add time penalty
    gameTime += SLED.crashTimePenalty;
  }

  // Track section scoring
  const worldX = scrollX + sled.screenX;
  const sectionIdx = track.getSectionIndex(worldX);

  // Accumulate time in current section
  if (sectionIdx >= 0 && sectionIdx < TRACK.sectionCount) {
    sectionTotalTime[sectionIdx] += dt;

    // Check if on racing line
    const curveDir = track.getCurveDirection(worldX);
    const curveInt = track.getCurveIntensity(worldX);
    if (curveInt > 0.1) {
      const racingLineTarget = curveDir * SLED.racingLinePosition;
      const distFromRacingLine = Math.abs(sled.trackPosition - racingLineTarget);
      if (distFromRacingLine < 0.2) {
        sectionRacingTime[sectionIdx] += dt;
      }
    } else {
      // Straights: any center-ish position counts as racing line
      if (Math.abs(sled.trackPosition) < 0.3) {
        sectionRacingTime[sectionIdx] += dt;
      }
    }

    // Track wall contact
    if (wallContact.scraping) {
      sectionWallContact[sectionIdx] = true;
    }
  }

  // Grade previous section when we enter a new one
  if (sectionIdx > lastSectionIndex) {
    for (let i = lastSectionIndex; i < sectionIdx; i++) {
      gradeSection(i);
    }
    lastSectionIndex = sectionIdx;
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

  // Check finish
  if (scrollX + sled.screenX >= track.finishX) {
    // Grade any remaining sections
    for (let i = lastSectionIndex; i < TRACK.sectionCount; i++) {
      gradeSection(i);
    }
    gameState = STATE.FINISH;
    finishTimer = 0;
  }
}

function gradeSection(index) {
  if (index < 0 || index >= TRACK.sectionCount) return;
  if (sectionGrades[index] !== undefined) return; // Already graded

  const total = sectionTotalTime[index];
  const racing = sectionRacingTime[index];
  const hadWallContact = sectionWallContact[index];

  if (total <= 0) {
    // Section was skipped or very brief
    sectionGrades[index] = 'B';
    return;
  }

  const racingRatio = racing / total;

  if (racingRatio >= SCORING.sectionS.threshold) {
    sectionGrades[index] = 'S';
  } else if (racingRatio >= SCORING.sectionA.threshold) {
    sectionGrades[index] = 'A';
  } else if (!hadWallContact) {
    sectionGrades[index] = 'B';
  } else {
    sectionGrades[index] = 'C';
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

// --- FINISH ---
function updateFinish(dt) {
  // Decelerate sled
  sled.speed = Math.max(0, sled.speed - 80 * dt);
  scrollX += sled.speed * dt;

  finishTimer += dt;
  if (finishTimer > 2.0) {
    // Calculate style points
    calculateStylePoints();

    // Check high score (time-based, lower is better)
    if (highScore === null || gameTime < highScore) {
      isNewBest = true;
      highScore = gameTime;
      localStorage.setItem(HS_KEY, String(highScore));
    } else {
      isNewBest = false;
    }

    gameState = STATE.RESULTS;
    resultsSelection = 0;
    resultsInputDelay = 0.5;
    blinkTimer = 0;
  }
}

function calculateStylePoints() {
  stylePoints = 0;

  // Push rating points
  stylePoints += SCORING.pushRating[pushRating.toLowerCase()] || 0;

  // Section grade points
  for (let i = 0; i < TRACK.sectionCount; i++) {
    const grade = sectionGrades[i] || 'C';
    switch (grade) {
      case 'S': stylePoints += SCORING.sectionS.points; break;
      case 'A': stylePoints += SCORING.sectionA.points; break;
      case 'B': stylePoints += SCORING.sectionB.points; break;
      case 'C': stylePoints += SCORING.sectionC.points; break;
    }
  }

  // Crash penalty
  stylePoints += crashes * SCORING.crashPenalty;

  // Clean run bonus
  const hadAnyWallContact = sectionWallContact.some(w => w);
  if (!hadAnyWallContact && crashes === 0) {
    stylePoints += SCORING.cleanRunBonus;
  }

  stylePoints = Math.max(0, stylePoints);
}

// --- RESULTS ---
function updateResults(dt) {
  resultsInputDelay -= dt;
  if (resultsInputDelay > 0) {
    // Drain pending inputs during delay
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
      // Map touch/click position to canvas coordinates
      const rect = canvas.getBoundingClientRect();
      const canvasY = ((pos.y - rect.top) / rect.height) * GAME_HEIGHT;

      const optionY = renderer.getResultsOptionY();
      const optionSpacing = renderer.getResultsOptionSpacing();
      const hitZone = optionSpacing / 2;

      let tappedOption = -1;
      for (let i = 0; i < RESULTS_OPTIONS; i++) {
        const y = optionY + i * optionSpacing;
        if (canvasY >= y - hitZone && canvasY < y + hitZone) {
          tappedOption = i;
          break;
        }
      }

      if (tappedOption >= 0) {
        resultsSelection = tappedOption;
        executeResultsAction();
      }
    } else {
      // Keyboard Enter — execute current selection
      executeResultsAction();
    }
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
  const minutes = Math.floor(gameTime / 60);
  const seconds = Math.floor(gameTime % 60);
  const hundredths = Math.floor((gameTime % 1) * 100);
  const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;

  // Count grades
  const gradeCounts = { S: 0, A: 0, B: 0, C: 0 };
  for (const g of sectionGrades) {
    if (gradeCounts[g] !== undefined) gradeCounts[g]++;
  }

  const shareText = `Bobsled - Winter Olympics 2026\n` +
    `Time: ${timeStr} | Style: ${stylePoints}\n` +
    `Push: ${pushRating} | Sections: ${gradeCounts.S}S ${gradeCounts.A}A ${gradeCounts.B}B ${gradeCounts.C}C` +
    (isNewBest ? `\nNEW BEST!` : '');

  if (navigator.share) {
    navigator.share({
      title: 'Bobsled - Winter Olympics 2026',
      text: shareText,
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(shareText).then(() => {
      renderer.showCopiedMessage();
    }).catch(() => {});
  }
}

// --- Render ---
function render(dt) {
  renderer.clear();

  switch (gameState) {
    case STATE.TITLE:
      renderer.drawTitle(blinkTimer);
      break;

    case STATE.COUNTDOWN:
      renderPlayfield(dt);
      renderer.drawCountdown(countdownCount);
      break;

    case STATE.PLAYING:
      renderPlayfield(dt);
      if (playPhase === PLAY_PHASE.PUSH) {
        renderer.drawPushMeter(pushMeterFill, pushRating || null, PUSH.duration - pushTimer);
      }
      break;

    case STATE.FINISH:
      renderPlayfield(dt);
      break;

    case STATE.RESULTS:
      renderPlayfield(dt);
      renderer.drawResults(
        gameTime, stylePoints, pushRating, sectionGrades, crashes,
        highScore, isNewBest, resultsSelection, blinkTimer
      );
      break;
  }
}

function renderPlayfield(dt) {
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
  renderer.drawHUD(gameTime, sled.speed, sectionIdx, TRACK.sectionCount);

  renderer.restoreScreenShake(shakeApplied);

  // Crash flash overlay (outside shake context)
  renderer.drawCrashFlash(crashFlash);
}

// --- Start ---
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
