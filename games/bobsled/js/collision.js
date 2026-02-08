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
// Returns 'scrape', 'bounce', or null
export function applyWallEffects(sled) {
  const absPos = Math.abs(sled.trackPosition);

  if (absPos >= SLED.wallBounceThreshold) {
    // Hard wall bounce: push sled back toward center
    const sign = sled.trackPosition > 0 ? 1 : -1;
    sled.trackPosition = sign * (SLED.wallBounceThreshold - 0.05);
    sled.lean *= -SLED.wallBounceRestitution; // reverse lean partially
    sled.speed *= SLED.wallFrictionSpeed;
    return 'bounce';
  }

  if (absPos > SLED.wallScrapeThreshold) {
    // Wall scrape: friction bleeds speed
    // Scale friction by how deep into the scrape zone
    const scrapeDepth = (absPos - SLED.wallScrapeThreshold) /
      (SLED.wallBounceThreshold - SLED.wallScrapeThreshold);
    const friction = 1.0 - (1.0 - SLED.wallFrictionSpeed) * scrapeDepth;
    sled.speed *= friction;
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
