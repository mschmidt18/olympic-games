// Landing page - menu navigation and snow background effect

const gameUrls = {
  skiing: 'games/skiing/index.html',
  bobsled: 'games/bobsled/index.html',
};

// --- Menu Navigation ---
const menuItems = document.querySelectorAll('.game-item');
let activeIndex = 0;

function setActive(index) {
  menuItems.forEach((item, i) => {
    item.classList.toggle('active', i === index);
  });
  activeIndex = index;
}

function launchGame(gameId) {
  const url = gameUrls[gameId];
  if (url) {
    window.location.href = url;
  }
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    let next = activeIndex - 1;
    if (next < 0) next = menuItems.length - 1;
    setActive(next);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    let next = activeIndex + 1;
    if (next >= menuItems.length) next = 0;
    setActive(next);
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const item = menuItems[activeIndex];
    if (!item.classList.contains('disabled')) {
      launchGame(item.dataset.game);
    }
  }
});

// Touch / click navigation
menuItems.forEach((item, index) => {
  item.addEventListener('click', () => {
    setActive(index);
    if (!item.classList.contains('disabled')) {
      launchGame(item.dataset.game);
    }
  });
});

// --- Snow Background Effect ---
const snowCanvas = document.getElementById('snow-bg');
const snowCtx = snowCanvas.getContext('2d');

let snowflakes = [];
const MAX_FLAKES = 60;

function resizeSnowCanvas() {
  snowCanvas.width = window.innerWidth;
  snowCanvas.height = window.innerHeight;
}

function initSnow() {
  resizeSnowCanvas();
  window.addEventListener('resize', resizeSnowCanvas);

  for (let i = 0; i < MAX_FLAKES; i++) {
    snowflakes.push({
      x: Math.random() * snowCanvas.width,
      y: Math.random() * snowCanvas.height,
      size: 1 + Math.floor(Math.random() * 2),
      speed: 0.3 + Math.random() * 0.8,
      drift: (Math.random() - 0.5) * 0.3,
    });
  }

  requestAnimationFrame(animateSnow);
}

function animateSnow(timestamp) {
  snowCtx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);

  // Draw a subtle gradient background
  const gradient = snowCtx.createLinearGradient(0, 0, 0, snowCanvas.height);
  gradient.addColorStop(0, '#0a0a1a');
  gradient.addColorStop(1, '#181828');
  snowCtx.fillStyle = gradient;
  snowCtx.fillRect(0, 0, snowCanvas.width, snowCanvas.height);

  // Draw and update snowflakes
  snowCtx.fillStyle = 'rgba(252, 252, 252, 0.6)';
  for (const flake of snowflakes) {
    snowCtx.fillRect(
      Math.floor(flake.x),
      Math.floor(flake.y),
      flake.size,
      flake.size
    );

    flake.y += flake.speed;
    flake.x += flake.drift;

    // Wrap around
    if (flake.y > snowCanvas.height) {
      flake.y = -2;
      flake.x = Math.random() * snowCanvas.width;
    }
    if (flake.x < 0) flake.x = snowCanvas.width;
    if (flake.x > snowCanvas.width) flake.x = 0;
  }

  requestAnimationFrame(animateSnow);
}

initSnow();
