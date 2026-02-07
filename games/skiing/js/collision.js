export function checkGatePass(player, gate, scrollY) {
  if (gate.passed || gate.missed) return null;

  const playerWorldY = scrollY + player.screenY + player.height / 2;

  // Check if the player has crossed this gate's Y line
  if (playerWorldY >= gate.worldY) {
    const leftEdge = gate.x - gate.width / 2;
    const rightEdge = gate.x + gate.width / 2;

    if (player.x >= leftEdge && player.x <= rightEdge) {
      gate.passed = true;
      gate.flashTimer = 0.5;
      return 'passed';
    } else {
      gate.missed = true;
      gate.flashTimer = 0.8;
      return 'missed';
    }
  }

  return null;
}

export function checkObstacleCollision(player, obstacle, scrollY) {
  const screenY = obstacle.worldY - scrollY;

  // AABB overlap
  const ox = obstacle.x - obstacle.width / 2;
  const oy = screenY - obstacle.height / 2;
  const ow = obstacle.width;
  const oh = obstacle.height;

  const px = player.x - player.width / 2;
  const py = player.screenY;
  const pw = player.width;
  const ph = player.height;

  return px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy;
}
