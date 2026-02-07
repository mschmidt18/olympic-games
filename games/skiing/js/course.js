import { COURSE, GAME_WIDTH } from './constants.js';

export class Course {
  constructor() {
    this.gates = [];
    this.obstacles = [];
    this.finishY = 0;
    this.decorations = []; // snow texture, course markers
  }

  generate() {
    this.gates = [];
    this.obstacles = [];
    this.decorations = [];

    let y = 180; // first gate offset from start
    const centerX = GAME_WIDTH / 2;

    for (let i = 0; i < COURSE.totalGates; i++) {
      // Spacing between gates
      y += COURSE.gateSpacingMin + Math.random() * (COURSE.gateSpacingMax - COURSE.gateSpacingMin);

      // Gate position oscillates in a slalom pattern
      const swing = Math.sin(i * 0.8) * 55 + (Math.random() - 0.5) * 30;
      const gateX = Math.max(COURSE.courseMarginLeft + 30,
        Math.min(COURSE.courseMarginRight - 30, centerX + swing));

      // Gate width varies slightly
      const gateWidth = COURSE.gateWidthMin +
        Math.random() * (COURSE.gateWidthMax - COURSE.gateWidthMin);

      this.gates.push({
        worldY: y,
        x: gateX,
        width: gateWidth,
        passed: false,
        missed: false,
        color: i % 2 === 0 ? 'red' : 'blue',
        index: i,
        flashTimer: 0,
      });

      // Scatter obstacles between gates (avoiding the gate area)
      const numObstacles = Math.floor(Math.random() * 3);
      for (let j = 0; j < numObstacles; j++) {
        let ox;
        // Place obstacles away from the gate opening
        const side = Math.random() > 0.5 ? 1 : -1;
        if (side > 0) {
          ox = gateX + gateWidth / 2 + 10 + Math.random() * 40;
        } else {
          ox = gateX - gateWidth / 2 - 10 - Math.random() * 40;
        }
        ox = Math.max(10, Math.min(GAME_WIDTH - 10, ox));

        this.obstacles.push({
          worldY: y - 30 + Math.random() * 20,
          x: ox,
          type: Math.random() > 0.3 ? 'tree' : 'rock',
          width: 6,
          height: 12,
        });
      }
    }

    this.finishY = y + COURSE.finishBuffer;

    // Generate decorations (small snow details, course boundary markers)
    this.generateDecorations();
  }

  generateDecorations() {
    // Course boundary flags along the sides
    for (let y = 0; y < this.finishY + 100; y += 40) {
      // Left boundary marker
      this.decorations.push({
        worldY: y,
        x: 4,
        type: 'flag',
      });
      // Right boundary marker
      this.decorations.push({
        worldY: y,
        x: GAME_WIDTH - 6,
        type: 'flag',
      });
    }

    // Random snow bumps/shadows
    for (let y = 0; y < this.finishY + 100; y += 8) {
      const count = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        this.decorations.push({
          worldY: y + Math.random() * 8,
          x: 10 + Math.random() * (GAME_WIDTH - 20),
          type: 'snow',
        });
      }
    }
  }

  // Get gates that are near the visible area
  getVisibleGates(scrollY, bufferTop = 40, bufferBottom = 20) {
    return this.gates.filter(g => {
      const screenY = g.worldY - scrollY;
      return screenY > -bufferTop && screenY < 240 + bufferBottom;
    });
  }

  getVisibleObstacles(scrollY, buffer = 20) {
    return this.obstacles.filter(o => {
      const screenY = o.worldY - scrollY;
      return screenY > -buffer && screenY < 240 + buffer;
    });
  }

  getVisibleDecorations(scrollY, buffer = 10) {
    return this.decorations.filter(d => {
      const screenY = d.worldY - scrollY;
      return screenY > -buffer && screenY < 240 + buffer;
    });
  }
}
