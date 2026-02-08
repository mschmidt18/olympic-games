import { SLED } from './constants.js';

// Create a new sled object with default state
export function createSled() {
  return {
    screenX: SLED.screenX,
    lean: 0,           // -1.0 (full left) to +1.0 (full right)
    trackPosition: 0,  // -1.0 (bottom wall) to +1.0 (top wall)
    speed: SLED.speedBase,
    sprite: 'level',   // 'level', 'lean_up', 'lean_down'
    invincibleTimer: 0,
    visible: true,
    flickerTimer: 0,
  };
}

// Reset sled to initial state (for restart)
export function resetSled(sled) {
  sled.lean = 0;
  sled.trackPosition = 0;
  sled.speed = SLED.speedBase;
  sled.sprite = 'level';
  sled.invincibleTimer = 0;
  sled.visible = true;
  sled.flickerTimer = 0;
}

// Update sled physics each frame
export function updateSled(sled, dt, input, track, scrollX) {
  // --- Invincibility flicker ---
  if (sled.invincibleTimer > 0) {
    sled.invincibleTimer -= dt;
    sled.flickerTimer += dt;
    sled.visible = Math.floor(sled.flickerTimer * SLED.invincibleFlickerRate) % 2 === 0;
    if (sled.invincibleTimer <= 0) {
      sled.invincibleTimer = 0;
      sled.visible = true;
    }
  }

  // --- Lean input with momentum ---
  const worldX = scrollX + sled.screenX;
  let targetLean = 0;

  if (input.left) {
    targetLean = -1.0;
  } else if (input.right) {
    targetLean = 1.0;
  }

  if (targetLean !== 0) {
    // Move lean toward target, dampened by momentum
    // leanMomentum (0.7) means lean changes at 30% of the raw rate
    const effectiveRate = SLED.leanRate * (1.0 - SLED.leanMomentum);
    if (targetLean > sled.lean) {
      sled.lean = Math.min(targetLean, sled.lean + effectiveRate * dt);
    } else {
      sled.lean = Math.max(targetLean, sled.lean - effectiveRate * dt);
    }
  } else {
    // No input: lean decays toward 0
    if (sled.lean > 0) {
      sled.lean = Math.max(0, sled.lean - SLED.leanDecay * dt);
    } else if (sled.lean < 0) {
      sled.lean = Math.min(0, sled.lean + SLED.leanDecay * dt);
    }
  }

  // Clamp lean
  sled.lean = Math.max(-1.0, Math.min(1.0, sled.lean));

  // --- Sprite state based on lean ---
  if (sled.lean < -0.2) {
    sled.sprite = 'lean_up'; // leaning left = front tilts up
  } else if (sled.lean > 0.2) {
    sled.sprite = 'lean_down'; // leaning right = front tilts down
  } else {
    sled.sprite = 'level';
  }

  // --- Curve forces on trackPosition ---
  const curveDirection = track.getCurveDirection(worldX);
  const curveIntensity = track.getCurveIntensity(worldX);

  // Centripetal force pushes sled toward outside wall
  // CURVE_LEFT (direction -1): pushes trackPosition toward +1 (top wall)
  // CURVE_RIGHT (direction 1): pushes trackPosition toward -1 (bottom wall)
  const centripetalForce = -curveDirection * curveIntensity * (sled.speed / SLED.speedMax);

  // Player lean counteracts the force
  // Correct lean direction: lean left (negative) for left curves, lean right (positive) for right curves
  const leanForce = sled.lean * 1.5; // lean influence on trackPosition

  // Net force on trackPosition
  const netForce = centripetalForce + leanForce;
  sled.trackPosition += netForce * dt;

  // On straights with no input, gently drift back to center
  if (curveIntensity < 0.05 && Math.abs(sled.lean) < 0.05) {
    if (sled.trackPosition > 0) {
      sled.trackPosition = Math.max(0, sled.trackPosition - 0.5 * dt);
    } else if (sled.trackPosition < 0) {
      sled.trackPosition = Math.min(0, sled.trackPosition + 0.5 * dt);
    }
  }

  // --- Speed: gravity acceleration + air drag ---
  sled.speed += SLED.speedAcceleration * dt;
  sled.speed *= Math.pow(SLED.airDrag, dt * 60); // normalize drag to 60fps

  // Racing line bonus: if close to optimal position inside the curve
  if (curveIntensity > 0.1) {
    // Racing line is at ±racingLinePosition toward the inside of the curve
    const racingLineTarget = curveDirection * SLED.racingLinePosition;
    const distFromRacingLine = Math.abs(sled.trackPosition - racingLineTarget);
    if (distFromRacingLine < 0.15) {
      sled.speed *= Math.pow(SLED.racingLineBonus, dt);
    }
  }

  // Clamp speed
  sled.speed = Math.min(SLED.speedMax, Math.max(0, sled.speed));
}

// Apply crash effects to sled
export function applyCrash(sled) {
  sled.speed *= SLED.crashSpeedMultiplier;
  sled.trackPosition *= 0.3; // push back toward center
  sled.lean = 0;
  sled.invincibleTimer = SLED.crashRecoveryTime;
  sled.flickerTimer = 0;
}
