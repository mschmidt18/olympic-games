import { GAME_WIDTH, GAME_HEIGHT, COLORS, STATE } from './constants.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    this.ctx.imageSmoothingEnabled = false;
    this.fontReady = false;

    // Wait for Press Start 2P font to load
    document.fonts.ready.then(() => {
      this.fontReady = true;
    });
  }

  clear() {
    this.ctx.fillStyle = COLORS.snow;
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  // --- Terrain & Decorations ---

  drawDecorations(decorations, scrollY) {
    const ctx = this.ctx;
    for (const d of decorations) {
      const sy = d.worldY - scrollY;
      if (d.type === 'snow') {
        ctx.fillStyle = COLORS.snowShadow;
        ctx.fillRect(Math.floor(d.x), Math.floor(sy), 2, 1);
      } else if (d.type === 'flag') {
        ctx.fillStyle = COLORS.red;
        ctx.fillRect(Math.floor(d.x), Math.floor(sy), 2, 4);
      }
    }
  }

  drawCourseBoundaries(scrollY) {
    const ctx = this.ctx;
    // Left tree line
    ctx.fillStyle = COLORS.green;
    ctx.fillRect(0, 0, 8, GAME_HEIGHT);
    ctx.fillStyle = COLORS.greenBright;
    for (let y = -(scrollY % 16); y < GAME_HEIGHT; y += 16) {
      ctx.fillRect(2, Math.floor(y), 4, 6);
      ctx.fillRect(1, Math.floor(y) + 2, 6, 3);
    }

    // Right tree line
    ctx.fillStyle = COLORS.green;
    ctx.fillRect(GAME_WIDTH - 8, 0, 8, GAME_HEIGHT);
    ctx.fillStyle = COLORS.greenBright;
    for (let y = -(scrollY % 16) + 8; y < GAME_HEIGHT; y += 16) {
      ctx.fillRect(GAME_WIDTH - 6, Math.floor(y), 4, 6);
      ctx.fillRect(GAME_WIDTH - 7, Math.floor(y) + 2, 6, 3);
    }
  }

  // --- Gates ---

  drawGate(gate, scrollY) {
    const ctx = this.ctx;
    const sy = Math.floor(gate.worldY - scrollY);
    const leftPoleX = Math.floor(gate.x - gate.width / 2);
    const rightPoleX = Math.floor(gate.x + gate.width / 2);

    const poleColor = gate.color === 'red' ? COLORS.red : COLORS.blueDark;
    const flagColor = gate.color === 'red' ? COLORS.redLight : COLORS.sky;

    // Flash effect on pass/miss
    let alpha = 1;
    if (gate.flashTimer > 0) {
      alpha = Math.floor(gate.flashTimer * 8) % 2 === 0 ? 0.3 : 1;
    }

    ctx.globalAlpha = alpha;

    // Left pole
    ctx.fillStyle = poleColor;
    ctx.fillRect(leftPoleX, sy - 12, 2, 12);
    // Left flag
    ctx.fillStyle = flagColor;
    ctx.fillRect(leftPoleX + 2, sy - 12, 4, 3);

    // Right pole
    ctx.fillStyle = poleColor;
    ctx.fillRect(rightPoleX, sy - 12, 2, 12);
    // Right flag
    ctx.fillStyle = flagColor;
    ctx.fillRect(rightPoleX - 4, sy - 12, 4, 3);

    // Gate pass indicator
    if (gate.passed) {
      ctx.fillStyle = COLORS.greenBright;
      ctx.fillRect(Math.floor(gate.x) - 1, sy - 14, 3, 2);
    } else if (gate.missed) {
      ctx.fillStyle = COLORS.red;
      ctx.fillRect(Math.floor(gate.x) - 2, sy - 14, 5, 1);
      ctx.fillRect(Math.floor(gate.x), sy - 15, 1, 3);
    }

    ctx.globalAlpha = 1;
  }

  // --- Obstacles ---

  drawTree(x, screenY) {
    const ctx = this.ctx;
    x = Math.floor(x) - 3;
    screenY = Math.floor(screenY) - 6;

    // Trunk
    ctx.fillStyle = COLORS.brown;
    ctx.fillRect(x + 2, screenY + 9, 2, 3);
    // Foliage bottom
    ctx.fillStyle = COLORS.green;
    ctx.fillRect(x, screenY + 5, 6, 4);
    // Foliage middle
    ctx.fillStyle = COLORS.greenBright;
    ctx.fillRect(x + 1, screenY + 2, 4, 4);
    // Foliage top
    ctx.fillRect(x + 2, screenY, 2, 3);
  }

  drawRock(x, screenY) {
    const ctx = this.ctx;
    x = Math.floor(x) - 3;
    screenY = Math.floor(screenY) - 3;

    ctx.fillStyle = COLORS.darkGray;
    ctx.fillRect(x + 1, screenY, 4, 4);
    ctx.fillRect(x, screenY + 1, 6, 2);
    // Highlight
    ctx.fillStyle = COLORS.gray;
    ctx.fillRect(x + 1, screenY, 2, 1);
  }

  drawObstacle(obstacle, scrollY) {
    const sy = obstacle.worldY - scrollY;
    if (obstacle.type === 'tree') {
      this.drawTree(obstacle.x, sy);
    } else {
      this.drawRock(obstacle.x, sy);
    }
  }

  // --- Player ---

  drawPlayer(player) {
    if (!player.visible) return;
    const ctx = this.ctx;
    const x = Math.floor(player.x) - 4;
    const y = Math.floor(player.screenY);

    if (player.sprite === 'left') {
      this.drawSkierLeft(ctx, x, y);
    } else if (player.sprite === 'right') {
      this.drawSkierRight(ctx, x, y);
    } else {
      this.drawSkierCenter(ctx, x, y);
    }
  }

  drawSkierCenter(ctx, x, y) {
    // Head / helmet
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(x + 2, y, 4, 3);
    // Goggles
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(x + 2, y + 1, 4, 1);
    // Body (red jacket)
    ctx.fillStyle = COLORS.red;
    ctx.fillRect(x + 1, y + 3, 6, 4);
    // Arms / poles
    ctx.fillStyle = COLORS.gray;
    ctx.fillRect(x, y + 4, 1, 6);
    ctx.fillRect(x + 7, y + 4, 1, 6);
    // Pole tips
    ctx.fillStyle = COLORS.darkGray;
    ctx.fillRect(x, y + 9, 1, 1);
    ctx.fillRect(x + 7, y + 9, 1, 1);
    // Legs (blue)
    ctx.fillStyle = COLORS.blueDark;
    ctx.fillRect(x + 2, y + 7, 2, 3);
    ctx.fillRect(x + 4, y + 7, 2, 3);
    // Skis
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(x + 1, y + 10, 3, 1);
    ctx.fillRect(x + 4, y + 10, 3, 1);
  }

  drawSkierLeft(ctx, x, y) {
    // Head
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(x + 1, y, 4, 3);
    // Goggles
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(x + 1, y + 1, 3, 1);
    // Body (angled left)
    ctx.fillStyle = COLORS.red;
    ctx.fillRect(x, y + 3, 6, 4);
    // Poles (angled)
    ctx.fillStyle = COLORS.gray;
    ctx.fillRect(x - 1, y + 3, 1, 7);
    ctx.fillRect(x + 6, y + 5, 1, 5);
    // Pole tips
    ctx.fillStyle = COLORS.darkGray;
    ctx.fillRect(x - 1, y + 9, 1, 1);
    ctx.fillRect(x + 6, y + 9, 1, 1);
    // Legs
    ctx.fillStyle = COLORS.blueDark;
    ctx.fillRect(x + 1, y + 7, 2, 3);
    ctx.fillRect(x + 3, y + 7, 2, 3);
    // Skis (angled left)
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(x - 1, y + 10, 3, 1);
    ctx.fillRect(x + 2, y + 10, 3, 1);
  }

  drawSkierRight(ctx, x, y) {
    // Head
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(x + 3, y, 4, 3);
    // Goggles
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(x + 4, y + 1, 3, 1);
    // Body (angled right)
    ctx.fillStyle = COLORS.red;
    ctx.fillRect(x + 2, y + 3, 6, 4);
    // Poles (angled)
    ctx.fillStyle = COLORS.gray;
    ctx.fillRect(x + 1, y + 5, 1, 5);
    ctx.fillRect(x + 8, y + 3, 1, 7);
    // Pole tips
    ctx.fillStyle = COLORS.darkGray;
    ctx.fillRect(x + 1, y + 9, 1, 1);
    ctx.fillRect(x + 8, y + 9, 1, 1);
    // Legs
    ctx.fillStyle = COLORS.blueDark;
    ctx.fillRect(x + 3, y + 7, 2, 3);
    ctx.fillRect(x + 5, y + 7, 2, 3);
    // Skis (angled right)
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(x + 3, y + 10, 3, 1);
    ctx.fillRect(x + 6, y + 10, 3, 1);
  }

  // --- Finish Line ---

  drawFinishLine(finishY, scrollY) {
    const sy = Math.floor(finishY - scrollY);
    if (sy < -10 || sy > GAME_HEIGHT + 10) return;

    const ctx = this.ctx;
    // Checkered pattern
    for (let x = 10; x < GAME_WIDTH - 10; x += 4) {
      const isWhite = (Math.floor(x / 4) % 2 === 0);
      ctx.fillStyle = isWhite ? COLORS.white : COLORS.black;
      ctx.fillRect(x, sy, 4, 2);
      ctx.fillStyle = isWhite ? COLORS.black : COLORS.white;
      ctx.fillRect(x, sy + 2, 4, 2);
    }

    // "FINISH" text above
    if (this.fontReady) {
      ctx.fillStyle = COLORS.gold;
      ctx.font = '6px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('FINISH', GAME_WIDTH / 2, sy - 4);
    }
  }

  // --- HUD ---

  drawHUD(time, gatesPassed, totalGates, score, combo) {
    const ctx = this.ctx;

    // Semi-transparent black bar at top
    ctx.fillStyle = 'rgba(24, 24, 24, 0.85)';
    ctx.fillRect(0, 0, GAME_WIDTH, 14);

    if (!this.fontReady) return;

    ctx.font = '6px "Press Start 2P"';
    ctx.textAlign = 'left';

    // Time
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const hundredths = Math.floor((time % 1) * 100);
    const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
    ctx.fillStyle = COLORS.white;
    ctx.fillText(timeStr, 4, 10);

    // Gates
    ctx.fillStyle = COLORS.skyLight;
    ctx.textAlign = 'center';
    ctx.fillText(`${gatesPassed}/${totalGates}`, GAME_WIDTH / 2, 10);

    // Score
    ctx.fillStyle = COLORS.gold;
    ctx.textAlign = 'right';
    ctx.fillText(`${score}`, GAME_WIDTH - 4, 10);

    // Combo indicator
    if (combo > 1) {
      ctx.fillStyle = COLORS.greenBright;
      ctx.font = '5px "Press Start 2P"';
      ctx.textAlign = 'right';
      ctx.fillText(`x${combo.toFixed(1)}`, GAME_WIDTH - 4, 20);
    }
  }

  // --- Title Screen ---

  drawTitle(blinkTimer) {
    const ctx = this.ctx;

    // Background - snowy mountain
    ctx.fillStyle = COLORS.sky;
    ctx.fillRect(0, 0, GAME_WIDTH, 120);
    ctx.fillStyle = COLORS.snow;
    ctx.fillRect(0, 120, GAME_WIDTH, 120);

    // Mountain silhouette
    ctx.fillStyle = COLORS.white;
    ctx.beginPath();
    ctx.moveTo(40, 120);
    ctx.lineTo(128, 30);
    ctx.lineTo(216, 120);
    ctx.fill();

    // Mountain shadow
    ctx.fillStyle = COLORS.snowShadow;
    ctx.beginPath();
    ctx.moveTo(128, 30);
    ctx.lineTo(170, 120);
    ctx.lineTo(216, 120);
    ctx.fill();

    // Snow cap
    ctx.fillStyle = COLORS.white;
    ctx.beginPath();
    ctx.moveTo(115, 50);
    ctx.lineTo(128, 30);
    ctx.lineTo(141, 50);
    ctx.lineTo(128, 45);
    ctx.fill();

    if (!this.fontReady) return;

    // Title
    ctx.fillStyle = COLORS.gold;
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('DOWNHILL', GAME_WIDTH / 2, 155);
    ctx.fillText('SKIING', GAME_WIDTH / 2, 170);

    // Olympic-themed subtitle
    ctx.fillStyle = COLORS.white;
    ctx.font = '5px "Press Start 2P"';
    ctx.fillText('WINTER OLYMPICS 2026', GAME_WIDTH / 2, 188);

    // Blinking "press start" text
    if (Math.floor(blinkTimer * 2) % 2 === 0) {
      ctx.fillStyle = COLORS.white;
      ctx.font = '5px "Press Start 2P"';
      ctx.fillText('TAP OR PRESS ENTER', GAME_WIDTH / 2, 215);
    }

    // Controls hint
    ctx.fillStyle = COLORS.darkGray;
    ctx.font = '4px "Press Start 2P"';
    ctx.fillText('TOUCH LEFT/RIGHT OR ARROW KEYS', GAME_WIDTH / 2, 232);
  }

  // --- Countdown ---

  drawCountdown(count) {
    const ctx = this.ctx;
    if (!this.fontReady) return;

    ctx.fillStyle = COLORS.gold;
    ctx.font = '16px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = count > 0 ? String(count) : 'GO!';
    ctx.fillText(text, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);

    ctx.textBaseline = 'alphabetic';
  }

  // --- Results Screen ---

  drawResults(time, gatesPassed, gatesMissed, totalGates, score, blinkTimer) {
    const ctx = this.ctx;

    // Dim background
    ctx.fillStyle = 'rgba(24, 24, 24, 0.9)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (!this.fontReady) return;

    ctx.textAlign = 'center';

    // Title
    ctx.fillStyle = COLORS.gold;
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('RESULTS', GAME_WIDTH / 2, 40);

    // Divider
    ctx.fillStyle = COLORS.darkGray;
    ctx.fillRect(40, 50, GAME_WIDTH - 80, 1);

    // Time
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const hundredths = Math.floor((time % 1) * 100);
    const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;

    ctx.fillStyle = COLORS.white;
    ctx.font = '6px "Press Start 2P"';
    ctx.fillText('TIME', GAME_WIDTH / 2, 72);
    ctx.fillStyle = COLORS.skyLight;
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText(timeStr, GAME_WIDTH / 2, 88);

    // Gates
    ctx.fillStyle = COLORS.white;
    ctx.font = '6px "Press Start 2P"';
    ctx.fillText('GATES', GAME_WIDTH / 2, 110);
    ctx.fillStyle = COLORS.greenBright;
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText(`${gatesPassed}/${totalGates}`, GAME_WIDTH / 2, 126);

    // Missed
    if (gatesMissed > 0) {
      ctx.fillStyle = COLORS.red;
      ctx.font = '5px "Press Start 2P"';
      ctx.fillText(`${gatesMissed} MISSED`, GAME_WIDTH / 2, 140);
    }

    // Score
    ctx.fillStyle = COLORS.white;
    ctx.font = '6px "Press Start 2P"';
    ctx.fillText('SCORE', GAME_WIDTH / 2, 162);
    ctx.fillStyle = COLORS.gold;
    ctx.font = '10px "Press Start 2P"';
    ctx.fillText(`${score}`, GAME_WIDTH / 2, 182);

    // Options
    if (Math.floor(blinkTimer * 2) % 2 === 0) {
      ctx.fillStyle = COLORS.white;
      ctx.font = '5px "Press Start 2P"';
      ctx.fillText('TAP OR ENTER TO RETRY', GAME_WIDTH / 2, 210);
    }

    ctx.fillStyle = COLORS.darkGray;
    ctx.font = '4px "Press Start 2P"';
    ctx.fillText('OR PRESS ESC FOR MENU', GAME_WIDTH / 2, 228);
  }
}
