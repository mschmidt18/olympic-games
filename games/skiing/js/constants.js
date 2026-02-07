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

// Player settings
export const PLAYER = {
  startX: 128,
  screenY: 64,
  maxSpeed: 130,
  acceleration: 350,
  friction: 220,
  width: 8,
  height: 12,
  invincibleTime: 1.0,
};

// Scroll / course settings
export const COURSE = {
  scrollSpeedBase: 80,
  scrollSpeedMax: 140,
  scrollAcceleration: 3,
  gateSpacingMin: 80,
  gateSpacingMax: 120,
  gateWidth: 40,
  gateWidthMin: 30,
  gateWidthMax: 50,
  totalGates: 30,
  courseMarginLeft: 16,
  courseMarginRight: 240,
  obstaclePadding: 14,
  finishBuffer: 200,
};

// Scoring
export const SCORING = {
  gatePass: 100,
  gateMiss: -50,
  obstacleHit: -25,
  comboMultipliers: [1.0, 1.5, 2.0, 2.5, 3.0],
  missTimePenalty: 2.0,
  hitTimePenalty: 1.0,
  hitSpeedReduction: 0.5,
};

// Game states
export const STATE = {
  TITLE: 'TITLE',
  COUNTDOWN: 'COUNTDOWN',
  PLAYING: 'PLAYING',
  FINISH: 'FINISH',
  RESULTS: 'RESULTS',
};
