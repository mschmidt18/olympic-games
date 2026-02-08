import { GAME_WIDTH, GAME_HEIGHT, COLORS, SLED, TRACK } from './constants.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    this.ctx.imageSmoothingEnabled = false;
    this.fontReady = false;
    this._copiedTimer = 0;

    document.fonts.ready.then(() => {
      this.fontReady = true;
    });
  }

  // --- Core ---

  clear() {
    this.ctx.fillStyle = COLORS.black;
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  applyScreenShake(shakeAmount) {
    if (shakeAmount > 0) {
      const sx = Math.floor((Math.random() * 2 - 1) * shakeAmount);
      const sy = Math.floor((Math.random() * 2 - 1) * shakeAmount);
      this.ctx.save();
      this.ctx.translate(sx, sy);
      return true;
    }
    return false;
  }

  restoreScreenShake(applied) {
    if (applied) {
      this.ctx.restore();
    }
  }

  // --- 1. Track Rendering ---

  drawTrack(track, scrollX, sled) {
    const ctx = this.ctx;

    for (let screenX = 0; screenX < GAME_WIDTH; screenX++) {
      const worldX = scrollX + screenX;
      const centerY = track.getCenterY(worldX);
      const halfWidth = track.getHalfWidth(worldX);

      const top = Math.floor(centerY - halfWidth);
      const bottom = Math.floor(centerY + halfWidth);
      const height = bottom - top;

      // Ice surface
      ctx.fillStyle = COLORS.skyLight;
      ctx.fillRect(screenX, top, 1, height);

      // Racing line zone (subtle 2px indicator in curves)
      const curveDir = track.getCurveDirection(worldX);
      const curveInt = track.getCurveIntensity(worldX);
      if (curveInt > 0.1) {
        const racingLinePos = curveDir * SLED.racingLinePosition;
        const racingLineY = Math.floor(centerY + racingLinePos * halfWidth);
        ctx.fillStyle = COLORS.sky;
        ctx.fillRect(screenX, racingLineY - 1, 1, 2);
      }

      // Top wall (4px thick)
      const topWallColor = this._getWallColor(screenX, 'top', sled);
      ctx.fillStyle = topWallColor;
      ctx.fillRect(screenX, top - 4, 1, 4);
      // Wall highlight
      ctx.fillStyle = COLORS.gray;
      ctx.fillRect(screenX, top - 1, 1, 1);

      // Bottom wall (4px thick)
      const bottomWallColor = this._getWallColor(screenX, 'bottom', sled);
      ctx.fillStyle = bottomWallColor;
      ctx.fillRect(screenX, bottom, 1, 4);
      // Wall highlight
      ctx.fillStyle = COLORS.gray;
      ctx.fillRect(screenX, bottom, 1, 1);
    }
  }

  _getWallColor(screenX, wall, sled) {
    // Only tint walls near the sled's X position
    const dist = Math.abs(screenX - SLED.screenX);
    if (dist > 20) return COLORS.darkGray;

    const absPos = Math.abs(sled.trackPosition);
    const nearWall = (wall === 'top' && sled.trackPosition > 0) ||
                     (wall === 'bottom' && sled.trackPosition < 0);

    if (!nearWall) return COLORS.darkGray;

    if (absPos > SLED.wallScrapeThreshold) {
      return COLORS.red;
    } else if (absPos > 0.7) {
      return COLORS.orange;
    }
    return COLORS.darkGray;
  }

  // --- 2. Sled Sprite ---

  drawSled(sled, track, scrollX) {
    if (!sled.visible) return;

    const ctx = this.ctx;
    const worldX = scrollX + sled.screenX;
    const centerY = track.getCenterY(worldX);
    const halfWidth = track.getHalfWidth(worldX);

    // Map trackPosition (-1..+1) to screen Y within channel
    const sledY = Math.floor(centerY + sled.trackPosition * halfWidth);
    const x = sled.screenX;

    if (sled.sprite === 'lean_up') {
      this._drawSledLeanUp(ctx, x, sledY);
    } else if (sled.sprite === 'lean_down') {
      this._drawSledLeanDown(ctx, x, sledY);
    } else {
      this._drawSledLevel(ctx, x, sledY);
    }
  }

  _drawSledLevel(ctx, x, y) {
    // Runners (bottom)
    ctx.fillStyle = COLORS.darkGray;
    ctx.fillRect(x - 5, y + 2, 10, 1);
    // Body
    ctx.fillStyle = COLORS.red;
    ctx.fillRect(x - 4, y - 1, 8, 3);
    // Front crew helmet
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(x - 3, y - 3, 2, 2);
    // Back crew helmet
    ctx.fillRect(x + 1, y - 3, 2, 2);
  }

  _drawSledLeanUp(ctx, x, y) {
    // Runners (angled - front higher)
    ctx.fillStyle = COLORS.darkGray;
    ctx.fillRect(x - 5, y + 2, 10, 1);
    ctx.fillRect(x - 5, y + 1, 3, 1);
    // Body (front tilted up)
    ctx.fillStyle = COLORS.red;
    ctx.fillRect(x - 4, y - 2, 4, 3);
    ctx.fillRect(x, y - 1, 4, 3);
    // Front crew helmet (higher)
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(x - 3, y - 4, 2, 2);
    // Back crew helmet
    ctx.fillRect(x + 1, y - 3, 2, 2);
    // Dark accent
    ctx.fillStyle = COLORS.redDark;
    ctx.fillRect(x - 4, y - 2, 2, 1);
  }

  _drawSledLeanDown(ctx, x, y) {
    // Runners (angled - front lower)
    ctx.fillStyle = COLORS.darkGray;
    ctx.fillRect(x - 5, y + 2, 10, 1);
    ctx.fillRect(x + 3, y + 1, 3, 1);
    // Body (front tilted down)
    ctx.fillStyle = COLORS.red;
    ctx.fillRect(x - 4, y - 1, 4, 3);
    ctx.fillRect(x, y - 2, 4, 3);
    // Front crew helmet
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(x - 3, y - 3, 2, 2);
    // Back crew helmet (higher)
    ctx.fillRect(x + 1, y - 4, 2, 2);
    // Dark accent
    ctx.fillStyle = COLORS.redDark;
    ctx.fillRect(x + 2, y + 1, 2, 1);
  }

  // --- 3. HUD Bar ---

  drawHUD(time, speed, sectionIndex, totalSections) {
    const ctx = this.ctx;

    // Semi-transparent black bar
    ctx.fillStyle = 'rgba(24, 24, 24, 0.85)';
    ctx.fillRect(0, 0, GAME_WIDTH, 14);

    if (!this.fontReady) return;

    ctx.font = '6px "Press Start 2P"';

    // TIME (left, white)
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const hundredths = Math.floor((time % 1) * 100);
    const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
    ctx.fillStyle = COLORS.white;
    ctx.textAlign = 'left';
    ctx.fillText(timeStr, 4, 10);

    // SPEED (center, sky) in km/h
    const kmh = Math.floor(speed * 0.5);
    ctx.fillStyle = COLORS.sky;
    ctx.textAlign = 'center';
    ctx.fillText(`${kmh}km/h`, GAME_WIDTH / 2, 10);

    // SECTION (right, gold)
    ctx.fillStyle = COLORS.gold;
    ctx.textAlign = 'right';
    ctx.fillText(`${sectionIndex + 1}/${totalSections}`, GAME_WIDTH - 4, 10);
  }

  // --- 4. Lean Indicator ---

  drawLeanIndicator(sled, track, scrollX) {
    const ctx = this.ctx;
    const barY = GAME_HEIGHT - 10;
    const barX = 20;
    const barW = GAME_WIDTH - 40;
    const barH = 6;

    // Background
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(barX, barY, barW, barH);

    // Optimal zone for current curve
    const worldX = scrollX + sled.screenX;
    const curveDir = track.getCurveDirection(worldX);
    const curveInt = track.getCurveIntensity(worldX);

    if (curveInt > 0.1) {
      const optimalLean = curveDir;
      const optCenter = barX + ((optimalLean + 1) / 2) * barW;
      const optWidth = Math.max(4, 20 * (1.0 - curveInt * 0.5));
      ctx.fillStyle = COLORS.greenBright;
      ctx.fillRect(Math.floor(optCenter - optWidth / 2), barY, Math.floor(optWidth), barH);
    }

    // Current lean marker
    const leanX = barX + ((sled.lean + 1) / 2) * barW;
    ctx.fillStyle = COLORS.white;
    ctx.fillRect(Math.floor(leanX) - 1, barY - 1, 3, barH + 2);

    // Border
    ctx.strokeStyle = COLORS.gray;
    ctx.strokeRect(barX, barY, barW, barH);
  }

  // --- 5. Speed Lines ---

  drawSpeedLines(sled, track, scrollX) {
    if (sled.speed <= 120) return;

    const ctx = this.ctx;
    const count = Math.floor((sled.speed - 120) / 15) + 1;
    const worldX = scrollX + sled.screenX;
    const centerY = track.getCenterY(worldX);
    const halfWidth = track.getHalfWidth(worldX);

    ctx.fillStyle = COLORS.white;
    for (let i = 0; i < count; i++) {
      const y = centerY + (Math.random() * 2 - 1) * halfWidth * 0.8;
      const len = 4 + Math.random() * 8;
      const x = sled.screenX - 15 - Math.random() * 20;
      ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(len), 1);
    }
  }

  // --- 6. Spark Particles ---

  drawSparks(particles, dt) {
    const ctx = this.ctx;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), 2, 2);
    }
  }

  // --- 7. Crash Flash Overlay ---

  drawCrashFlash(flashAmount) {
    if (flashAmount <= 0) return;
    this.ctx.fillStyle = `rgba(248, 56, 0, ${flashAmount * 0.3})`;
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  // --- 8. Curve Direction Arrows ---

  drawCurveArrows(track, scrollX) {
    const ctx = this.ctx;
    if (!track.sections) return;

    for (const section of track.sections) {
      const screenX = section.startX - scrollX;
      // Only draw if visible on screen (with some margin)
      if (screenX < -20 || screenX > GAME_WIDTH + 20) continue;
      if (section.type === 'STRAIGHT') continue;

      const centerY = track.getCenterY(section.startX + 20);
      const dir = section.direction;

      ctx.fillStyle = COLORS.greenBright;

      // Small arrow pointing in curve direction
      const ax = Math.floor(screenX + 20);
      const ay = Math.floor(centerY);

      if (dir === -1) {
        // Left/up arrow
        ctx.fillRect(ax, ay - 3, 2, 6);
        ctx.fillRect(ax - 2, ay - 1, 2, 2);
        ctx.fillRect(ax + 2, ay - 1, 2, 2);
        ctx.fillRect(ax - 1, ay - 2, 1, 1);
      } else if (dir === 1) {
        // Right/down arrow
        ctx.fillRect(ax, ay - 3, 2, 6);
        ctx.fillRect(ax - 2, ay - 1, 2, 2);
        ctx.fillRect(ax + 2, ay - 1, 2, 2);
        ctx.fillRect(ax + 1, ay + 2, 1, 1);
      }
    }
  }

  // --- 9. Section Markers ---

  drawSectionMarkers(track, scrollX) {
    const ctx = this.ctx;
    if (!this.fontReady || !track.sections) return;

    ctx.font = '4px "Press Start 2P"';
    ctx.fillStyle = COLORS.gray;
    ctx.textAlign = 'center';

    for (const section of track.sections) {
      const screenX = section.startX - scrollX;
      if (screenX < -10 || screenX > GAME_WIDTH + 10) continue;

      const centerY = track.getCenterY(section.startX);
      const halfWidth = track.getHalfWidth(section.startX);

      // Number on top wall
      ctx.fillText(
        String(section.index + 1),
        Math.floor(screenX),
        Math.floor(centerY - halfWidth - 6)
      );
    }
  }

  // --- 10. Finish Line ---

  drawFinishLine(track, scrollX) {
    const finishX = track.getFinishX();
    const screenX = Math.floor(finishX - scrollX);
    if (screenX < -20 || screenX > GAME_WIDTH + 20) return;

    const ctx = this.ctx;
    const centerY = track.getCenterY(finishX);
    const halfWidth = track.getHalfWidth(finishX);
    const top = Math.floor(centerY - halfWidth);
    const bottom = Math.floor(centerY + halfWidth);

    // Checkered pattern spanning the channel width
    const checkerSize = 4;
    for (let y = top; y < bottom; y += checkerSize) {
      for (let dx = -8; dx <= 8; dx += checkerSize) {
        const col = Math.floor(dx / checkerSize);
        const row = Math.floor((y - top) / checkerSize);
        const isWhite = (col + row) % 2 === 0;
        ctx.fillStyle = isWhite ? COLORS.white : COLORS.black;
        ctx.fillRect(screenX + dx, y, checkerSize, Math.min(checkerSize, bottom - y));
      }
    }

    // "FINISH" text above
    if (this.fontReady) {
      ctx.fillStyle = COLORS.gold;
      ctx.font = '6px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('FINISH', screenX, top - 6);
    }
  }

  // --- 11. Title Screen ---

  drawTitle(blinkTimer) {
    const ctx = this.ctx;

    // Icy background
    ctx.fillStyle = COLORS.sky;
    ctx.fillRect(0, 0, GAME_WIDTH, 100);

    // Ice gradient below
    ctx.fillStyle = COLORS.skyLight;
    ctx.fillRect(0, 100, GAME_WIDTH, 40);

    ctx.fillStyle = COLORS.lightGray;
    ctx.fillRect(0, 140, GAME_WIDTH, 100);

    // Track silhouette (bobsled track cross-section)
    ctx.fillStyle = COLORS.darkGray;
    // Track channel shape
    ctx.fillRect(20, 80, 216, 4);
    ctx.fillRect(20, 120, 216, 4);
    // Curved walls
    for (let x = 0; x < 216; x++) {
      const t = x / 216;
      const offsetY = Math.sin(t * Math.PI * 2) * 15;
      ctx.fillRect(20 + x, 80 + Math.floor(offsetY), 1, 4);
      ctx.fillRect(20 + x, 120 + Math.floor(offsetY), 1, 4);
    }

    // Sled silhouette on the track
    ctx.fillStyle = COLORS.red;
    ctx.fillRect(80, 96, 12, 4);
    ctx.fillStyle = COLORS.darkGray;
    ctx.fillRect(78, 100, 14, 2);
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(82, 94, 3, 2);
    ctx.fillRect(87, 94, 3, 2);

    if (!this.fontReady) return;

    // Title
    ctx.fillStyle = COLORS.gold;
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('BOBSLED', GAME_WIDTH / 2, 160);

    // Subtitle
    ctx.fillStyle = COLORS.white;
    ctx.font = '5px "Press Start 2P"';
    ctx.fillText('WINTER OLYMPICS 2026', GAME_WIDTH / 2, 175);

    // Blinking start prompt
    if (Math.floor(blinkTimer * 2) % 2 === 0) {
      ctx.fillStyle = COLORS.white;
      ctx.font = '5px "Press Start 2P"';
      ctx.fillText('TAP OR PRESS ENTER', GAME_WIDTH / 2, 205);
    }

    // Controls hint
    ctx.fillStyle = COLORS.darkGray;
    ctx.font = '4px "Press Start 2P"';
    ctx.fillText('LEFT/RIGHT TO LEAN', GAME_WIDTH / 2, 225);
    ctx.fillText('TAP FAST TO PUSH START', GAME_WIDTH / 2, 233);
  }

  // --- 12. Countdown ---

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

  // --- 13. Push Start Meter ---

  drawPushMeter(fillPercent, rating, timeRemaining) {
    const ctx = this.ctx;
    const barX = 40;
    const barY = GAME_HEIGHT - 40;
    const barW = GAME_WIDTH - 80;
    const barH = 12;

    // "PUSH!" text
    if (this.fontReady) {
      ctx.fillStyle = COLORS.white;
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('PUSH!', GAME_WIDTH / 2, barY - 16);

      // Time remaining
      ctx.fillStyle = COLORS.gold;
      ctx.font = '5px "Press Start 2P"';
      ctx.fillText(Math.ceil(timeRemaining).toFixed(0), GAME_WIDTH / 2, barY - 6);
    }

    // Bar background
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(barX, barY, barW, barH);

    // Color zones in background
    const zoneW = barW / 3;
    ctx.fillStyle = COLORS.redDark;
    ctx.fillRect(barX, barY, zoneW, barH);
    ctx.fillStyle = COLORS.brownLight;
    ctx.fillRect(barX + zoneW, barY, zoneW, barH);
    ctx.fillStyle = COLORS.green;
    ctx.fillRect(barX + zoneW * 2, barY, zoneW, barH);

    // Dim unfilled portion
    const fillW = Math.floor(barW * Math.min(1, fillPercent));
    ctx.fillStyle = 'rgba(24, 24, 24, 0.7)';
    ctx.fillRect(barX + fillW, barY, barW - fillW, barH);

    // Border
    ctx.strokeStyle = COLORS.white;
    ctx.strokeRect(barX, barY, barW, barH);

    // Rating label (appears during/after push)
    if (rating && this.fontReady) {
      const ratingColors = {
        'PERFECT': COLORS.gold,
        'GREAT': COLORS.greenBright,
        'GOOD': COLORS.sky,
        'POOR': COLORS.darkGray,
      };
      ctx.fillStyle = ratingColors[rating] || COLORS.white;
      ctx.font = '6px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(rating, GAME_WIDTH / 2, barY + barH + 12);
    }
  }

  // --- 14. Results Screen ---

  drawResults(time, stylePoints, pushRating, sectionGrades, crashes,
              highScore, isNewBest, selection, blinkTimer) {
    const ctx = this.ctx;

    // Dim background
    ctx.fillStyle = 'rgba(24, 24, 24, 0.92)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (!this.fontReady) return;

    ctx.textAlign = 'center';

    // Title
    ctx.fillStyle = COLORS.gold;
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('RESULTS', GAME_WIDTH / 2, 24);

    // Divider
    ctx.fillStyle = COLORS.darkGray;
    ctx.fillRect(40, 30, GAME_WIDTH - 80, 1);

    // TIME
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const hundredths = Math.floor((time % 1) * 100);
    const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;

    ctx.fillStyle = COLORS.white;
    ctx.font = '5px "Press Start 2P"';
    ctx.fillText('TIME', GAME_WIDTH / 2, 44);
    ctx.fillStyle = COLORS.skyLight;
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText(timeStr, GAME_WIDTH / 2, 56);

    // STYLE POINTS
    ctx.fillStyle = COLORS.white;
    ctx.font = '5px "Press Start 2P"';
    ctx.fillText('STYLE', GAME_WIDTH / 2, 70);
    ctx.fillStyle = COLORS.gold;
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText(String(stylePoints), GAME_WIDTH / 2, 82);

    // Push rating
    ctx.fillStyle = COLORS.white;
    ctx.font = '5px "Press Start 2P"';
    ctx.fillText('PUSH', 60, 96);
    const pushColors = {
      'PERFECT': COLORS.gold,
      'GREAT': COLORS.greenBright,
      'GOOD': COLORS.sky,
      'POOR': COLORS.darkGray,
    };
    ctx.fillStyle = pushColors[pushRating] || COLORS.white;
    ctx.fillText(pushRating || 'N/A', 60, 106);

    // Section grades summary
    ctx.fillStyle = COLORS.white;
    ctx.textAlign = 'center';
    ctx.fillText('SECTIONS', GAME_WIDTH - 60, 96);

    // Count grades
    const gradeCounts = { S: 0, A: 0, B: 0, C: 0 };
    if (sectionGrades) {
      for (const g of sectionGrades) {
        if (gradeCounts[g] !== undefined) gradeCounts[g]++;
      }
    }

    const gradeStr = `${gradeCounts.S}S ${gradeCounts.A}A ${gradeCounts.B}B ${gradeCounts.C}C`;
    ctx.fillStyle = COLORS.skyLight;
    ctx.font = '4px "Press Start 2P"';
    ctx.fillText(gradeStr, GAME_WIDTH - 60, 106);

    // Crashes
    if (crashes > 0) {
      ctx.fillStyle = COLORS.red;
      ctx.font = '5px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(`${crashes} CRASH${crashes > 1 ? 'ES' : ''}`, GAME_WIDTH / 2, 118);
    }

    // High score / New best
    const bestY = crashes > 0 ? 132 : 124;
    if (isNewBest) {
      if (Math.floor(blinkTimer * 3) % 2 === 0) {
        ctx.fillStyle = COLORS.gold;
        ctx.font = '6px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('NEW BEST!', GAME_WIDTH / 2, bestY);
      }
    } else if (highScore !== null) {
      const hsMin = Math.floor(highScore / 60);
      const hsSec = Math.floor(highScore % 60);
      const hsHun = Math.floor((highScore % 1) * 100);
      const hsStr = `${hsMin}:${String(hsSec).padStart(2, '0')}.${String(hsHun).padStart(2, '0')}`;
      ctx.fillStyle = COLORS.darkGray;
      ctx.font = '5px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(`BEST ${hsStr}`, GAME_WIDTH / 2, bestY);
    }

    // Divider before options
    ctx.fillStyle = COLORS.darkGray;
    ctx.fillRect(50, bestY + 8, GAME_WIDTH - 100, 1);

    // Menu options
    const optionY = bestY + 22;
    const options = ['PLAY AGAIN', 'SHARE', 'BACK TO MENU'];
    const optionSpacing = 18;

    // Store layout for touch targeting
    this._resultsOptionY = optionY;
    this._resultsOptionSpacing = optionSpacing;
    this._resultsCrashes = crashes;

    for (let i = 0; i < options.length; i++) {
      const y = optionY + i * optionSpacing;
      const isSelected = i === selection;

      if (isSelected) {
        // Blinking cursor
        if (Math.floor(blinkTimer * 2.5) % 2 === 0) {
          ctx.fillStyle = COLORS.gold;
          ctx.font = '6px "Press Start 2P"';
          ctx.textAlign = 'right';
          ctx.fillText('\u25B6', GAME_WIDTH / 2 - 52, y);
        }
        ctx.fillStyle = COLORS.white;
      } else {
        ctx.fillStyle = COLORS.darkGray;
      }

      ctx.font = '6px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(options[i], GAME_WIDTH / 2, y);
    }

    // Copied message
    if (this._copiedTimer > 0) {
      ctx.fillStyle = COLORS.greenBright;
      ctx.font = '4px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('COPIED TO CLIPBOARD!', GAME_WIDTH / 2, GAME_HEIGHT - 8);
    }
  }

  getResultsOptionY() {
    return this._resultsOptionY || 0;
  }

  getResultsOptionSpacing() {
    return this._resultsOptionSpacing || 18;
  }

  showCopiedMessage() {
    this._copiedTimer = 2.0;
    const fade = () => {
      this._copiedTimer -= 0.016;
      if (this._copiedTimer > 0) {
        requestAnimationFrame(fade);
      }
    };
    requestAnimationFrame(fade);
  }
}
