import { SLED } from './constants.js';

// Check if sled is scraping against a wall
// Returns { scraping: bool, side: 'top'|'bottom'|null }
export function checkWallContact(sled) {
  const absPos = Math.abs(sled.trackPosition);

  if (absPos > SLED.wallScrapeThreshold) {
    return {
      scraping: true,
      side: sled.trackPosition > 0 ? 'top' : 'bottom',
    };
  }

  return { scraping: false, side: null };
}

// Apply wall scrape effects: friction slows sled, bounce at edges
// dt parameter makes friction framerate-independent
// Returns 'scrape', 'bounce', or null
export function applyWallEffects(sled, dt) {
  const absPos = Math.abs(sled.trackPosition);

  if (absPos >= SLED.wallBounceThreshold) {
    // Hard wall bounce: push sled back toward center
    const sign = sled.trackPosition > 0 ? 1 : -1;
    sled.trackPosition = sign * (SLED.wallScrapeThreshold - 0.05); // push back below scrape zone
    sled.lean *= -SLED.wallBounceRestitution; // reverse lean partially
    sled.speed *= (1.0 - SLED.wallBounceSpeedLoss); // one-time 25% speed loss
    return 'bounce';
  }

  if (absPos > SLED.wallScrapeThreshold) {
    // Wall scrape: continuous friction, framerate-independent
    // scrapeDepth goes from 0 (just touching) to 1 (about to bounce)
    const scrapeDepth = (absPos - SLED.wallScrapeThreshold) /
      (SLED.wallBounceThreshold - SLED.wallScrapeThreshold);
    // Exponential decay: speed -= rate * depth * speed * dt
    sled.speed -= SLED.wallFrictionRate * scrapeDepth * sled.speed * dt;
    return 'scrape';
  }

  return null;
}

// Check if a crash should occur
// Crash happens when: hitting wall at high speed on a tight curve, and not invincible
export function checkCrash(sled, track, scrollX) {
  if (sled.invincibleTimer > 0) return false;

  const worldX = scrollX + sled.screenX;
  const curveIntensity = track.getCurveIntensity(worldX);
  const absPos = Math.abs(sled.trackPosition);

  return (
    sled.speed > SLED.crashSpeedThreshold &&
    curveIntensity > SLED.crashCurveThreshold &&
    absPos >= SLED.wallScrapeThreshold
  );
}
