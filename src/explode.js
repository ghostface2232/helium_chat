// 클릭 지점에서 버블들을 폭발시키는 모듈
import { Body } from 'matter-js';
import { getBubbles } from './bubble.js';

const IS_MOBILE = 'ontouchstart' in window;
const EXPLODE_RADIUS = IS_MOBILE ? 200 : 300;
const EXPLODE_FORCE = IS_MOBILE ? 0.04 : 0.08;

export function initExplode() {
  const area = document.getElementById('bubble-area');
  const areaRect = area.getBoundingClientRect();

  area.addEventListener('mousedown', (e) => {
    const clickX = e.clientX - areaRect.left;
    const clickY = e.clientY - areaRect.top;
    applyExplosion(clickX, clickY);
  });

  area.addEventListener('touchstart', (e) => {
    const rect = area.getBoundingClientRect();
    const touch = e.touches[0];
    const clickX = touch.clientX - rect.left;
    const clickY = touch.clientY - rect.top;
    applyExplosion(clickX, clickY);
  });
}

function applyExplosion(cx, cy) {
  const bubbles = getBubbles();

  for (const bubble of bubbles) {
    const { body } = bubble;
    const dx = body.position.x - cx;
    const dy = body.position.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > EXPLODE_RADIUS || dist < 1) continue;

    // 거리에 반비례하는 힘
    const strength = EXPLODE_FORCE * (1 - dist / EXPLODE_RADIUS);
    const angle = Math.atan2(dy, dx);

    Body.applyForce(body, body.position, {
      x: Math.cos(angle) * strength * body.mass,
      y: Math.sin(angle) * strength * body.mass,
    });
  }
}
