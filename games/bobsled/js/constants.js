// Game dimensions (NES native resolution)
export const GAME_WIDTH = 256;
export const GAME_HEIGHT = 240;

// NES Color Palette
export const COLORS = {
  white: '#FCFCFC',
  lightGray: '#D8D8D8',
  gray: '#B8B8B8',
  darkGray: '#7C7C7C',
  black: '#181818',

  skyLight: '#A4E4FC',
  sky: '#3CBCFC',
  blue: '#0078F8',
  blueDark: '#0058F8',

  red: '#F83800',
  redDark: '#A80000',
  redLight: '#F87858',

  greenBright: '#00A800',
  green: '#005800',
  greenLight: '#B8F818',

  gold: '#F8D878',
  yellow: '#F8E800',
  orange: '#FCA044',

  brown: '#503000',
  brownLight: '#AC7C00',

  snow: '#FCFCFC',
  snowShadow: '#A4E4FC',
};

// Game states
export const STATE = {
  TITLE: 'TITLE',
  COUNTDOWN: 'COUNTDOWN',
  PLAYING: 'PLAYING',
  FINISH: 'FINISH',
  RESULTS: 'RESULTS',
};

// Play phases within PLAYING state
export const PLAY_PHASE = {
  PUSH: 'PUSH',
  RACING: 'RACING',
};

// Sled physics
export const SLED = {
  screenX: 60,
  leanRate: 3.0,
  leanMomentum: 0.7,
  leanDecay: 2.0,
  speedBase: 60,
  speedMax: 160,
  speedAcceleration: 30,
  dragCoefficient: 0.19,
  racingLineBonus: 1.05,
  racingLinePosition: 0.3,
  wallScrapeThreshold: 0.85,
  wallBounceThreshold: 1.0,
  wallFrictionRate: 2.5,      // exponential speed decay rate per second at full scrape
  wallBounceSpeedLoss: 0.25,  // lose 25% speed on hard bounce
  wallBounceRestitution: 0.5,
  crashSpeedThreshold: 100,
  crashCurveThreshold: 0.8,
  crashTimePenalty: 3.0,
  crashSpeedMultiplier: 0.5,
  crashRecoveryTime: 1.5,
  invincibleFlickerRate: 10,
  width: 10,
  height: 6,
};

// Track generation
export const TRACK = {
  sectionCount: 20,
  sectionLengthMin: 300,
  sectionLengthMax: 480,
  trackWidth: 80,
  trackWidthMin: 50,
  trackCenterY: GAME_HEIGHT / 2,
  curveAmplitude: 60,
  chicaneAppearAfter: 7,
  intensityEarly: 0.3,
  intensityMid: 0.6,
  intensityLate: 1.0,
  maxConsecutiveSameDirection: 2,
};

// Push start phase
export const PUSH = {
  duration: 3.0,
  maxTaps: 20,
  speedBonusMax: 40,
  ratingThresholds: {
    perfect: 0.9,
    great: 0.7,
    good: 0.4,
  },
};

// Scoring
export const SCORING = {
  sectionS: { threshold: 0.8, points: 300 },
  sectionA: { threshold: 0.5, points: 200 },
  sectionB: { threshold: 0.0, points: 100 },
  sectionC: { points: 0 },
  pushRating: { perfect: 500, great: 300, good: 100, poor: 0 },
  crashPenalty: -200,
  cleanRunBonus: 1000,
};
