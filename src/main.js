import './style.css';
import { initInput } from './input.js';
import { initPhysics, startPhysics, resizePhysics } from './physics.js';
import { createBubble, getBubbles } from './bubble.js';
import { startRenderLoop } from './render-loop.js';
import { initExplode } from './explode.js';
import { Body } from 'matter-js';

const KEYBOARD_THRESHOLD = 100;
const ORIENTATION_WIDTH_DELTA = 120;

const { engine, walls } = initPhysics();
startPhysics(engine);
startRenderLoop();

let currentWalls = walls;
let resizeTimer = null;
let stableLayoutWidth = window.innerWidth;
let stableLayoutHeight = window.innerHeight;
let maxObservedHeight = window.innerHeight;

function isEditableFocused() {
  const active = document.activeElement;
  if (!active) return false;

  const tag = active.tagName;
  return tag === 'TEXTAREA' || tag === 'INPUT' || active.isContentEditable;
}

function getKeyboardInset() {
  if (!window.visualViewport) return 0;
  return Math.max(0, window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop);
}

function isKeyboardOpen() {
  if (!window.visualViewport) return false;

  const viewportBottom = window.visualViewport.height + window.visualViewport.offsetTop;
  const deltaFromStable = stableLayoutHeight - viewportBottom;
  const activeInput = isEditableFocused();
  const compressedViewport = window.visualViewport.height < stableLayoutHeight - KEYBOARD_THRESHOLD;

  return deltaFromStable > KEYBOARD_THRESHOLD || (activeInput && compressedViewport);
}

function applyStableAppHeight(height) {
  document.documentElement.style.setProperty('--stable-app-height', `${height}px`);
}

function commitStableViewport(width, height) {
  stableLayoutWidth = width;
  stableLayoutHeight = height;
  maxObservedHeight = Math.max(maxObservedHeight, height);
  applyStableAppHeight(stableLayoutHeight);
}

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

commitStableViewport(window.innerWidth, window.innerHeight);

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const widthDelta = Math.abs(window.innerWidth - stableLayoutWidth);
    const orientationChanged = widthDelta >= ORIENTATION_WIDTH_DELTA;

    // 키보드에 의한 시각 뷰포트 축소는 물리 월드 경계 변경에서 제외
    if (isKeyboardOpen()) {
      return;
    }

    const shouldUseMaxHeight = window.innerHeight < maxObservedHeight - KEYBOARD_THRESHOLD;
    const nextHeight = orientationChanged
      ? window.innerHeight
      : (shouldUseMaxHeight ? maxObservedHeight : window.innerHeight);

    commitStableViewport(window.innerWidth, nextHeight);
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
      commitStableViewport(window.innerWidth, window.innerHeight);
    }
  }

  visualViewport.addEventListener('resize', onViewportChange);
  visualViewport.addEventListener('scroll', onViewportChange);
  onViewportChange();
}
