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
// 초기 뷰포트 크기 기록 — 키보드에 의한 높이 축소를 무시하기 위해 사용
let lastWidth = document.getElementById('bubble-area').clientWidth;
let maxHeight = document.getElementById('bubble-area').clientHeight;

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const area = document.getElementById('bubble-area');
    const w = area.clientWidth;
    const h = area.clientHeight;

    // 높이가 이전 최대값보다 커지면 갱신 (화면 회전 등)
    if (h > maxHeight) maxHeight = h;

    // 너비 변경 없고 높이가 줄어든 경우(키보드 팝업) → 벽 재생성 건너뜀
    if (w === lastWidth && h < maxHeight) return;
    lastWidth = w;

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
