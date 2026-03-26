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

// 텍스트 입력 포커스 중 높이만 줄어드는 리사이즈는 모바일 키보드로 간주
function isKeyboardResize(w, h) {
  const area = document.getElementById('bubble-area');
  const prevW = area.dataset.prevWidth ? Number(area.dataset.prevWidth) : w;
  const prevH = area.dataset.prevHeight ? Number(area.dataset.prevHeight) : h;
  const widthSame = w === prevW;
  const heightShrunk = h < prevH;
  const inputFocused = document.activeElement &&
    (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT');
  return widthSame && heightShrunk && inputFocused;
}

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const area = document.getElementById('bubble-area');
    const w = area.clientWidth;
    const h = area.clientHeight;

    // 모바일 키보드에 의한 높이 축소 → 물리 월드 변경 건너뜀
    if (isKeyboardResize(w, h)) {
      return;
    }
    area.dataset.prevWidth = w;
    area.dataset.prevHeight = h;

    currentWalls = resizePhysics(engine, currentWalls);

    // 경계 밖 버블을 안쪽으로 보정
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

// iOS Safari 소프트 키보드 대응 — input bar 위치만 조정, 물리 월드는 변경하지 않음
// 버블은 역중력으로 항상 화면 최상단에 쌓이므로 키보드 영역과 충돌하지 않음
if (window.visualViewport) {
  const inputBar = document.getElementById('input-bar');
  function onViewportResize() {
    const offset = window.innerHeight - visualViewport.height - visualViewport.offsetTop;
    inputBar.style.bottom = offset + 'px';
  }
  visualViewport.addEventListener('resize', onViewportResize);
  visualViewport.addEventListener('scroll', onViewportResize);
}
