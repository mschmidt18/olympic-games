import { TRACK, GAME_HEIGHT } from './constants.js';

// Section types
export const SECTION_TYPE = {
  STRAIGHT: 'STRAIGHT',
  CURVE_LEFT: 'CURVE_LEFT',
  CURVE_RIGHT: 'CURVE_RIGHT',
  CHICANE: 'CHICANE',
};

// Generate a procedural bobsled track with 20 sections
export function generateTrack() {
  const sections = generateSections();
  const finishX = computeFinishX(sections);
  const geometry = buildGeometry(sections);

  return {
    sections,
    finishX,
    getCenterY: (worldX) => sampleGeometry(geometry, worldX, 'centerY'),
    getHalfWidth: (worldX) => sampleGeometry(geometry, worldX, 'halfWidth'),
    getCurveDirection: (worldX) => getCurveDirectionAt(sections, worldX),
    getCurveIntensity: (worldX) => getCurveIntensityAt(sections, worldX),
    getSectionIndex: (worldX) => getSectionIndexAt(sections, worldX),
    getSectionType: (worldX) => getSectionTypeAt(sections, worldX),
    getFinishX: () => finishX,
  };
}

// --- Section Generation ---

function generateSections() {
  const sections = [];
  let worldX = 0;
  let lastDirection = 0; // -1 left, 0 straight, 1 right
  let sameDirectionCount = 0;

  for (let i = 0; i < TRACK.sectionCount; i++) {
    const length = TRACK.sectionLengthMin +
      Math.random() * (TRACK.sectionLengthMax - TRACK.sectionLengthMin);

    let type;
    let intensity = 0;
    let direction = 0;

    if (i === 0 || i === TRACK.sectionCount - 1) {
      // First and last sections are always straight
      type = SECTION_TYPE.STRAIGHT;
    } else {
      // Determine difficulty tier
      const progress = i / (TRACK.sectionCount - 1);
      let baseIntensity;
      if (i <= 7) {
        baseIntensity = TRACK.intensityEarly;
      } else if (i <= 14) {
        baseIntensity = TRACK.intensityMid;
      } else {
        baseIntensity = TRACK.intensityLate;
      }

      // Add slight randomness to intensity
      intensity = baseIntensity + (Math.random() - 0.5) * 0.15;
      intensity = Math.max(0.2, Math.min(1.0, intensity));

      // Choose section type
      const canChicane = i >= TRACK.chicaneAppearAfter;
      const roll = Math.random();

      if (roll < 0.2) {
        // ~20% chance straight
        type = SECTION_TYPE.STRAIGHT;
        intensity = 0;
        direction = 0;
      } else if (canChicane && roll < 0.35) {
        // ~15% chance chicane (after section 7)
        type = SECTION_TYPE.CHICANE;
        // Chicane direction: which way it starts
        direction = pickDirection(lastDirection, sameDirectionCount);
      } else {
        // Curve
        direction = pickDirection(lastDirection, sameDirectionCount);
        type = direction === -1 ? SECTION_TYPE.CURVE_LEFT : SECTION_TYPE.CURVE_RIGHT;
      }
    }

    sections.push({
      index: i,
      type,
      startX: worldX,
      length,
      intensity,
      direction, // -1 left, 0 straight/neutral, 1 right
    });

    // Track consecutive direction for alternation
    if (direction !== 0) {
      if (direction === lastDirection) {
        sameDirectionCount++;
      } else {
        sameDirectionCount = 1;
      }
      lastDirection = direction;
    }

    worldX += length;
  }

  return sections;
}

function pickDirection(lastDirection, sameDirectionCount) {
  // Enforce max consecutive same-direction curves
  if (sameDirectionCount >= TRACK.maxConsecutiveSameDirection && lastDirection !== 0) {
    return -lastDirection;
  }
  // Bias toward alternating
  if (lastDirection !== 0 && Math.random() < 0.7) {
    return -lastDirection;
  }
  return Math.random() < 0.5 ? -1 : 1;
}

// --- Geometry Building ---
// Pre-compute centerY and halfWidth at every integer worldX for fast lookup

function buildGeometry(sections) {
  const totalLength = sections[sections.length - 1].startX + sections[sections.length - 1].length;
  // Store sampled points at regular intervals for efficiency
  // We sample every pixel for smooth rendering
  const pointCount = Math.ceil(totalLength) + 1;
  const centerYs = new Float32Array(pointCount);
  const halfWidths = new Float32Array(pointCount);

  const baseCenterY = TRACK.trackCenterY;
  const baseHalfWidth = TRACK.trackWidth / 2;
  const minHalfWidth = TRACK.trackWidthMin / 2;

  for (let x = 0; x < pointCount; x++) {
    const section = getSectionAt(sections, x);
    if (!section) {
      centerYs[x] = baseCenterY;
      halfWidths[x] = baseHalfWidth;
      continue;
    }

    const localT = (x - section.startX) / section.length; // 0..1 within section
    // Smooth ease in/out within section
    const ease = smoothstep(localT);

    let offsetY = 0;
    let widthFactor = 1.0;

    switch (section.type) {
      case SECTION_TYPE.STRAIGHT:
        offsetY = 0;
        widthFactor = 1.0;
        break;

      case SECTION_TYPE.CURVE_LEFT:
        // Channel bends upward (negative Y = up on screen)
        offsetY = -section.intensity * TRACK.curveAmplitude * Math.sin(localT * Math.PI);
        // Track narrows slightly in tight curves
        widthFactor = 1.0 - section.intensity * 0.2 * Math.sin(localT * Math.PI);
        break;

      case SECTION_TYPE.CURVE_RIGHT:
        // Channel bends downward (positive Y = down on screen)
        offsetY = section.intensity * TRACK.curveAmplitude * Math.sin(localT * Math.PI);
        widthFactor = 1.0 - section.intensity * 0.2 * Math.sin(localT * Math.PI);
        break;

      case SECTION_TYPE.CHICANE: {
        // S-curve: first half one direction, second half the other
        const chicaneT = localT * 2 * Math.PI; // full S over the section
        offsetY = section.direction * section.intensity * TRACK.curveAmplitude * 0.7 * Math.sin(chicaneT);
        widthFactor = 1.0 - section.intensity * 0.15 * Math.abs(Math.sin(chicaneT));
        break;
      }
    }

    centerYs[x] = baseCenterY + offsetY;
    halfWidths[x] = Math.max(minHalfWidth, baseHalfWidth * widthFactor);
  }

  // Smooth the geometry to eliminate any abrupt transitions between sections
  smoothArray(centerYs, 8);
  smoothArray(halfWidths, 4);

  return { centerYs, halfWidths, length: pointCount };
}

// Simple moving average smoothing pass
function smoothArray(arr, radius) {
  const len = arr.length;
  const temp = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - radius); j <= Math.min(len - 1, i + radius); j++) {
      sum += arr[j];
      count++;
    }
    temp[i] = sum / count;
  }
  for (let i = 0; i < len; i++) {
    arr[i] = temp[i];
  }
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

// --- Geometry Queries ---

function sampleGeometry(geometry, worldX, field) {
  const x = Math.max(0, Math.min(geometry.length - 1, Math.floor(worldX)));
  if (field === 'centerY') return geometry.centerYs[x];
  if (field === 'halfWidth') return geometry.halfWidths[x];
  return 0;
}

function getSectionAt(sections, worldX) {
  for (let i = sections.length - 1; i >= 0; i--) {
    if (worldX >= sections[i].startX) {
      return sections[i];
    }
  }
  return sections[0];
}

function getSectionIndexAt(sections, worldX) {
  const section = getSectionAt(sections, worldX);
  return section ? section.index : 0;
}

function getSectionTypeAt(sections, worldX) {
  const section = getSectionAt(sections, worldX);
  return section ? section.type : SECTION_TYPE.STRAIGHT;
}

function getCurveDirectionAt(sections, worldX) {
  const section = getSectionAt(sections, worldX);
  if (!section) return 0;

  switch (section.type) {
    case SECTION_TYPE.CURVE_LEFT: return -1;
    case SECTION_TYPE.CURVE_RIGHT: return 1;
    case SECTION_TYPE.CHICANE: {
      // Direction changes halfway through chicane
      const localT = (worldX - section.startX) / section.length;
      return localT < 0.5 ? section.direction : -section.direction;
    }
    default: return 0;
  }
}

function getCurveIntensityAt(sections, worldX) {
  const section = getSectionAt(sections, worldX);
  if (!section) return 0;
  if (section.type === SECTION_TYPE.STRAIGHT) return 0;

  const localT = (worldX - section.startX) / section.length;
  // Intensity peaks in the middle of the curve
  return section.intensity * Math.sin(localT * Math.PI);
}

function computeFinishX(sections) {
  const last = sections[sections.length - 1];
  return last.startX + last.length;
}
