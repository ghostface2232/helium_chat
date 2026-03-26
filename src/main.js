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
