import './style.css';
import { initInput } from './input.js';
import { initPhysics, startPhysics, resizePhysics } from './physics.js';
import { createBubble, getBubbles } from './bubble.js';
import { startRenderLoop } from './render-loop.js';
import { initExplode } from './explode.js';
import { Body } from 'matter-js';

const { engine, walls } = initPhysics();
startPhysics(engine);
startRenderLoop();

let currentWalls = walls;
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    currentWalls = resizePhysics(engine, currentWalls);

    // 경계 밖 버블을 안쪽으로 보정
    const area = document.getElementById('bubble-area');
    const w = area.clientWidth;
    const h = area.clientHeight;
    for (const bubble of getBubbles()) {
      const { body, width, height } = bubble;
      const x = Math.max(width / 2, Math.min(w - width / 2, body.position.x));
      const y = Math.max(height / 2, Math.min(h - height / 2, body.position.y));
      if (x !== body.position.x || y !== body.position.y) {
        Body.setPosition(body, { x, y });
      }
    }
  }, 200);
});

initInput((text) => {
  createBubble(text, engine);
});

initExplode();

// iOS Safari 소프트 키보드 대응
if (window.visualViewport) {
  const inputBar = document.getElementById('input-bar');
  function onViewportResize() {
    const offset = window.innerHeight - visualViewport.height;
    inputBar.style.bottom = offset + 'px';

    // 키보드에 맞춰 천장/벽 재배치 (버블이 화면 밖으로 사라지지 않도록)
    currentWalls = resizePhysics(engine, currentWalls, {
      height: visualViewport.height,
      offsetTop: visualViewport.offsetTop
    });
  }
  visualViewport.addEventListener('resize', onViewportResize);
  visualViewport.addEventListener('scroll', onViewportResize);
}
