import './style.css';
import { initInput } from './input.js';
import { initPhysics, startPhysics, resizePhysics } from './physics.js';
import { createBubble, getBubbles } from './bubble.js';
import { startRenderLoop } from './render-loop.js';
import { initExplode } from './explode.js';
import { Body } from 'matter-js';

const KEYBOARD_THRESHOLD = 120;

const { engine, walls } = initPhysics();
startPhysics(engine);
startRenderLoop();

let currentWalls = walls;
let resizeTimer = null;
let baselineLayoutHeight = window.innerHeight;

function clampBubblesIntoBounds() {
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
}

function syncPhysicsBounds() {
  currentWalls = resizePhysics(engine, currentWalls);
  clampBubblesIntoBounds();
}

function getKeyboardInset() {
  if (!window.visualViewport) return 0;
  return Math.max(0, window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop);
}

function isKeyboardOpen() {
  if (!window.visualViewport) return false;

  const keyboardDelta = baselineLayoutHeight - (window.visualViewport.height + window.visualViewport.offsetTop);
  return keyboardDelta > KEYBOARD_THRESHOLD;
}

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    // 키보드에 의한 시각 뷰포트 축소는 물리 월드 경계 변경에서 제외
    if (isKeyboardOpen()) {
      return;
    }

    baselineLayoutHeight = window.innerHeight;
    syncPhysicsBounds();
  }, 200);
});

initInput((text) => {
  createBubble(text, engine);
});

initExplode();

// 소프트 키보드 대응: 입력바만 키보드 상단으로 올리고 물리 천장은 고정 유지
if (window.visualViewport) {
  const inputBar = document.getElementById('input-bar');

  function onViewportChange() {
    const keyboardInset = getKeyboardInset();
    inputBar.style.transform = keyboardInset > 0 ? `translateY(-${keyboardInset}px)` : '';

    // 키보드가 닫힌 안정 상태에서만 기준 높이 갱신
    if (!isKeyboardOpen()) {
      baselineLayoutHeight = window.innerHeight;
    }
  }

  visualViewport.addEventListener('resize', onViewportChange);
  visualViewport.addEventListener('scroll', onViewportChange);
  onViewportChange();
}
