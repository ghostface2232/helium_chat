import './style.css';
import { initInput } from './input.js';
import { initPhysics, startPhysics, resizePhysics } from './physics.js';
import { createBubble, getBubbles } from './bubble.js';
import { startRenderLoop } from './render-loop.js';
import { initExplode } from './explode.js';
import { Body } from 'matter-js';

const KEYBOARD_THRESHOLD = 100;
const VIEWPORT_SYNC_DEBOUNCE = 120;

function getViewportSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function isEditableFocused() {
  const active = document.activeElement;
  if (!active) return false;

  const tag = active.tagName;
  return tag === 'TEXTAREA' || tag === 'INPUT' || active.isContentEditable;
}

let stableViewport = getViewportSize();
const { engine, walls } = initPhysics(stableViewport);
startPhysics(engine);
startRenderLoop();

let currentWalls = walls;
let resizeTimer = null;
let viewportSyncTimer = null;

// 키보드가 닫혀 있을 때의 visualViewport 하단 좌표를 기준점으로 유지
let keyboardReferenceBottom = window.visualViewport
  ? window.visualViewport.height + window.visualViewport.offsetTop
  : stableViewport.height;

function getKeyboardInset() {
  if (!window.visualViewport) return 0;
  const viewportBottom = window.visualViewport.height + window.visualViewport.offsetTop;
  return Math.max(0, keyboardReferenceBottom - viewportBottom);
}

function isKeyboardOpen() {
  if (!window.visualViewport) {
    return isEditableFocused() && (window.innerHeight < stableViewport.height - KEYBOARD_THRESHOLD);
  }

  const keyboardInset = getKeyboardInset();
  const compressedViewport = window.visualViewport.height < keyboardReferenceBottom - KEYBOARD_THRESHOLD;
  return isEditableFocused() && (keyboardInset > KEYBOARD_THRESHOLD || compressedViewport);
}

function clampBubblesIntoBounds() {
  const { width, height } = stableViewport;

  for (const bubble of getBubbles()) {
    const { body, width: bubbleWidth, height: bubbleHeight } = bubble;
    const x = Math.max(bubbleWidth / 2, Math.min(width - bubbleWidth / 2, body.position.x));
    const y = Math.max(bubbleHeight / 2, Math.min(height - bubbleHeight / 2, body.position.y));

    if (x !== body.position.x || y !== body.position.y) {
      Body.setPosition(body, { x, y });
    }
  }
}

function syncPhysicsBounds() {
  currentWalls = resizePhysics(engine, currentWalls, stableViewport);
  clampBubblesIntoBounds();
}

function commitStableViewport(nextViewport) {
  stableViewport = nextViewport;
  syncPhysicsBounds();
}

function syncViewportAndPhysics() {
  const nextViewport = getViewportSize();
  const sizeChanged = (
    nextViewport.width !== stableViewport.width ||
    nextViewport.height !== stableViewport.height
  );

  if (!sizeChanged) {
    if (window.visualViewport && !isEditableFocused()) {
      keyboardReferenceBottom = window.visualViewport.height + window.visualViewport.offsetTop;
    }
    return;
  }

  // 키보드 세션에서는 벽을 절대 재배치하지 않는다
  if (isKeyboardOpen()) {
    return;
  }

  commitStableViewport(nextViewport);

  if (window.visualViewport && !isEditableFocused()) {
    keyboardReferenceBottom = window.visualViewport.height + window.visualViewport.offsetTop;
  }
}

document.addEventListener('focusout', () => {
  requestAnimationFrame(() => {
    if (!isEditableFocused()) {
      syncViewportAndPhysics();
    }
  });
});

window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(syncViewportAndPhysics, 120);
});

initInput((text) => {
  createBubble(text, engine);
});

initExplode();

// 소프트 키보드 대응: 입력바만 키보드 상단으로 이동, 물리 월드는 고정
if (window.visualViewport) {
  const inputBar = document.getElementById('input-bar');

  function onViewportChange() {
    const keyboardInset = getKeyboardInset();
    inputBar.style.transform = keyboardInset > 0 ? `translateY(-${keyboardInset}px)` : '';

    clearTimeout(viewportSyncTimer);
    viewportSyncTimer = setTimeout(() => {
      if (!isKeyboardOpen() && !isEditableFocused()) {
        keyboardReferenceBottom = window.visualViewport.height + window.visualViewport.offsetTop;
      }
      syncViewportAndPhysics();
    }, VIEWPORT_SYNC_DEBOUNCE);
  }

  visualViewport.addEventListener('resize', onViewportChange);
  visualViewport.addEventListener('scroll', onViewportChange);
  onViewportChange();
}
