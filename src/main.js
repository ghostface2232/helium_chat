import './style.css';
import { initInput } from './input.js';
import { initPhysics, startPhysics, resizePhysics } from './physics.js';
import { createBubble, getBubbles } from './bubble.js';
import { startRenderLoop } from './render-loop.js';
import { initExplode } from './explode.js';
import { Body } from 'matter-js';

const KEYBOARD_THRESHOLD = 100;
const ORIENTATION_WIDTH_DELTA = 120;
const VIEWPORT_SYNC_DEBOUNCE = 150;

const { engine, walls } = initPhysics();
startPhysics(engine);
startRenderLoop();

let currentWalls = walls;
let resizeTimer = null;
let viewportSyncTimer = null;

let stableLayoutWidth = getLayoutWidth();
let stableLayoutHeight = getLayoutHeight();

// 키보드가 닫힌 상태에서의 visual viewport 기준값
let keyboardReferenceHeight = window.visualViewport
  ? window.visualViewport.height + window.visualViewport.offsetTop
  : stableLayoutHeight;

function getLayoutWidth() {
  return document.documentElement.clientWidth || window.innerWidth;
}

function getLayoutHeight() {
  return document.documentElement.clientHeight || window.innerHeight;
}

function isEditableFocused() {
  const active = document.activeElement;
  if (!active) return false;

  const tag = active.tagName;
  return tag === 'TEXTAREA' || tag === 'INPUT' || active.isContentEditable;
}

function getKeyboardInsetFromReference() {
  if (!window.visualViewport) return 0;

  const viewportBottom = window.visualViewport.height + window.visualViewport.offsetTop;
  return Math.max(0, keyboardReferenceHeight - viewportBottom);
}

function isKeyboardOpen() {
  if (!window.visualViewport) return false;

  const activeInput = isEditableFocused();
  const insetFromReference = getKeyboardInsetFromReference();
  const compressedViewport =
    window.visualViewport.height < keyboardReferenceHeight - KEYBOARD_THRESHOLD;

  // iOS Safari는 키보드 열림 시 offsetTop이 함께 변하는 경우가 있어 함께 체크
  const shiftedViewport = window.visualViewport.offsetTop > 0;

  return activeInput && (insetFromReference > KEYBOARD_THRESHOLD || compressedViewport || shiftedViewport);
}

function applyStableAppHeight(height) {
  document.documentElement.style.setProperty('--stable-app-height', `${height}px`);
}

function commitStableViewport(width, height) {
  stableLayoutWidth = width;
  stableLayoutHeight = height;
  applyStableAppHeight(height);
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

function updateKeyboardReferenceIfStable() {
  if (!window.visualViewport || isKeyboardOpen() || isEditableFocused()) return;

  keyboardReferenceHeight = window.visualViewport.height + window.visualViewport.offsetTop;
}

function syncViewportAndPhysics() {
  const width = getLayoutWidth();
  const height = getLayoutHeight();
  const widthDelta = Math.abs(width - stableLayoutWidth);
  const orientationChanged = widthDelta >= ORIENTATION_WIDTH_DELTA;

  // 소프트 키보드 중에는 물리 월드 경계를 절대 갱신하지 않는다
  if (isKeyboardOpen()) {
    return;
  }

  const sizeChanged = width !== stableLayoutWidth || height !== stableLayoutHeight;
  if (!sizeChanged) {
    updateKeyboardReferenceIfStable();
    return;
  }

  // 모바일 브라우저 UI 변화(주소창 show/hide)로 인한 미세 흔들림 억제
  if (!orientationChanged && Math.abs(height - stableLayoutHeight) < KEYBOARD_THRESHOLD / 2 && widthDelta === 0) {
    updateKeyboardReferenceIfStable();
    return;
  }

  commitStableViewport(width, height);
  updateKeyboardReferenceIfStable();
  syncPhysicsBounds();
}

commitStableViewport(stableLayoutWidth, stableLayoutHeight);

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(syncViewportAndPhysics, 180);
});

initInput((text) => {
  createBubble(text, engine);
});

initExplode();

// 소프트 키보드 대응: 입력바만 키보드 상단으로 올리고 물리 천장은 고정 유지
if (window.visualViewport) {
  const inputBar = document.getElementById('input-bar');

  function onViewportChange() {
    const keyboardInset = getKeyboardInsetFromReference();
    inputBar.style.transform = keyboardInset > 0 ? `translateY(-${keyboardInset}px)` : '';

    clearTimeout(viewportSyncTimer);
    viewportSyncTimer = setTimeout(() => {
      if (!isKeyboardOpen() && !isEditableFocused()) {
        keyboardReferenceHeight = window.visualViewport.height + window.visualViewport.offsetTop;
      }
      syncViewportAndPhysics();
    }, VIEWPORT_SYNC_DEBOUNCE);
  }

  visualViewport.addEventListener('resize', onViewportChange);
  visualViewport.addEventListener('scroll', onViewportChange);
  onViewportChange();
}
