import { PLAYER, GAME_WIDTH } from './constants.js';

export class Player {
  constructor() {
    this.x = PLAYER.startX;
    this.screenY = PLAYER.screenY;
    this.velocityX = 0;
    this.width = PLAYER.width;
    this.height = PLAYER.height;
    this.sprite = 'center'; // 'center', 'left', 'right'
    this.invincibleTimer = 0;
    this.visible = true;
    this.flickerTimer = 0;
  }

  reset() {
    this.x = PLAYER.startX;
    this.velocityX = 0;
    this.sprite = 'center';
    this.invincibleTimer = 0;
    this.visible = true;
  }

  update(dt, input) {
    // Invincibility flicker
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
      this.flickerTimer += dt;
      this.visible = Math.floor(this.flickerTimer * 10) % 2 === 0;
      if (this.invincibleTimer <= 0) {
        this.invincibleTimer = 0;
        this.visible = true;
      }
    }

    // Movement
    if (input.left) {
      this.velocityX = Math.max(this.velocityX - PLAYER.acceleration * dt, -PLAYER.maxSpeed);
      this.sprite = 'left';
    } else if (input.right) {
      this.velocityX = Math.min(this.velocityX + PLAYER.acceleration * dt, PLAYER.maxSpeed);
      this.sprite = 'right';
    } else {
      // Friction
      if (this.velocityX > 0) {
        this.velocityX = Math.max(0, this.velocityX - PLAYER.friction * dt);
      } else {
        this.velocityX = Math.min(0, this.velocityX + PLAYER.friction * dt);
      }
      this.sprite = 'center';
    }

    this.x += this.velocityX * dt;
    // Clamp to course boundaries
    this.x = Math.max(12, Math.min(GAME_WIDTH - 12, this.x));
  }

  makeInvincible() {
    this.invincibleTimer = PLAYER.invincibleTime;
    this.flickerTimer = 0;
  }

  get isInvincible() {
    return this.invincibleTimer > 0;
  }
}
