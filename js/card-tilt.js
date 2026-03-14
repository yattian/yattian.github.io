(() => {
  const container = document.getElementById('cardTiltContainer');
  const card = document.getElementById('cardInner');
  const glare = document.getElementById('cardGlare');
  if (!container || !card || !glare) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Start with idle floating
  card.classList.add('idle');

  if (prefersReduced || isTouch) return;

  const MAX_TILT = 18;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let hovering = false;
  let rafId = null;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function animate() {
    currentX = lerp(currentX, targetX, 0.08);
    currentY = lerp(currentY, targetY, 0.08);

    card.style.transform = `rotateY(${currentX * MAX_TILT}deg) rotateX(${-currentY * MAX_TILT}deg)`;

    if (hovering || Math.abs(currentX - targetX) > 0.001 || Math.abs(currentY - targetY) > 0.001) {
      rafId = requestAnimationFrame(animate);
    } else {
      rafId = null;
    }
  }

  function startLoop() {
    if (!rafId) {
      rafId = requestAnimationFrame(animate);
    }
  }

  container.addEventListener('mouseenter', () => {
    hovering = true;
    card.classList.remove('idle');
    glare.style.opacity = '1';
    startLoop();
  });

  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalize to -1..1
    targetX = ((x / rect.width) * 2 - 1);
    targetY = ((y / rect.height) * 2 - 1);

    // Update glare position
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    card.style.setProperty('--glare-x', glareX + '%');
    card.style.setProperty('--glare-y', glareY + '%');
  });

  container.addEventListener('mouseleave', () => {
    hovering = false;
    targetX = 0;
    targetY = 0;
    glare.style.opacity = '0';
    startLoop();

    // Re-add idle after transition
    setTimeout(() => {
      if (!hovering) {
        card.classList.add('idle');
        card.style.transform = '';
      }
    }, 600);
  });
})();
